package org.clangen.autom8.ui.activity;

import android.app.ActionBar;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.IBinder;
import android.os.RemoteException;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.ContextMenu;
import android.view.ContextMenu.ContextMenuInfo;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.WindowManager;
import android.widget.AbsListView;
import android.widget.SeekBar;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.connection.Connection;
import org.clangen.autom8.connection.ConnectionLibrary;
import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceStatus;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.Group;
import org.clangen.autom8.device.Lamp;
import org.clangen.autom8.device.SecuritySensor;
import org.clangen.autom8.net.Client;
import org.clangen.autom8.net.Message;
import org.clangen.autom8.net.request.ArmSensor;
import org.clangen.autom8.net.request.ResetSensorStatus;
import org.clangen.autom8.net.request.SetDeviceStatus;
import org.clangen.autom8.net.request.SetLampBrightness;
import org.clangen.autom8.service.ClientService;
import org.clangen.autom8.service.IClientService;
import org.clangen.autom8.ui.adapter.BaseDeviceModelAdapter;
import org.clangen.autom8.ui.adapter.DeviceGroupModelAdapter;
import org.clangen.autom8.ui.model.BaseDeviceModel;

public class DevicesActivity extends Activity {
    private final static String TAG = "DevicesActivity";

    private final static int MENU_ID_EDIT_CONNECTION = 0;
    private final static int MENU_ID_SETTINGS = 1;
    private final static int MENU_ID_RECONNECT = 2;

    private final static IntentFilter INTENT_FILTER;
    private static boolean sFirstRunChecked;

    private View mDevicesView;
    private ViewHolder mViews = new ViewHolder();
    private ConnectionLibrary mConnectionLibrary;
    private IClientService mClientService;
    private boolean mPaused = true, mDestroyed;
    private boolean mServiceDisconnected;
    private BaseDeviceModelAdapter mListAdapter;

    private class ViewHolder {
        public View mConnectionStatusView;
        public View mConnectingView;
        public View mConnectedView;
        public View mDisconnectedView;
        public TextView mConnectedHostName;
        public TextView mConnectingTextView;
        public TextView mDisconnectedTextView;
        public AbsListView mListView;
    }

    static {
        INTENT_FILTER = new IntentFilter();
        INTENT_FILTER.addAction(ClientService.ACTION_AUTHENTICATION_FAILED);
        INTENT_FILTER.addAction(ClientService.ACTION_CONNECTION_STATE_CHANGED);
        INTENT_FILTER.addAction(SettingsActivity.ACTION_TRANSLUCENCY_TOGGLED);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        checkEnableTranslucency();
        getIntent().addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        super.onCreate(savedInstanceState);

        bindService();
        setContentView(R.layout.devices);
        registerReceiver(mBroadcastReceiver, INTENT_FILTER);

        init();
    }

    @Override
    public void onResume() {
        super.onResume();
        mPaused = false;

        final Intent intent = new Intent(this, ClientService.class);
        intent.setAction(ClientService.ACTION_INC_CLIENT_COUNT);
        startService(intent);

        updateUiFromClientServiceState();
        checkFirstRun();

        /*
         * mServiceDisconnected will get set to true if the Activity was
         * paused and the Service connection was forcibly reset because
         * the Service was automatically shut down.
         */
        if (mServiceDisconnected) {
            bindService();
        }
    }

    @Override
    public void onPause() {
        final Intent intent = new Intent(this, ClientService.class);
        intent.setAction(ClientService.ACTION_DEC_CLIENT_COUNT);
        startService(intent);

        mPaused = true;
        super.onPause();
    }

    @Override
    public void onCreateContextMenu(ContextMenu menu, View view, ContextMenuInfo menuInfo) {
        super.onCreateContextMenu(menu, view, menuInfo);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuItem item = menu.add(0, MENU_ID_SETTINGS, 0, R.string.menu_settings);
        item.setIcon(R.drawable.menu_settings);

        item = menu.add(0, MENU_ID_EDIT_CONNECTION, 1, R.string.menu_connection);
        item.setIcon(R.drawable.menu_connections);

        item = menu.add(0, MENU_ID_RECONNECT, 2, R.string.menu_reconnect);
        item.setIcon(R.drawable.menu_reconnect);

        return true;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_CAMERA) {
            final boolean interceptCamera = PreferenceManager
                .getDefaultSharedPreferences(this).getBoolean(
                    getString(R.string.pref_use_camera_button), false);

            if (interceptCamera && (event.getAction() == KeyEvent.ACTION_DOWN)) {
                /*
                 * Works around the case where the user holds the button too long and
                 * the ACTION_DOWN event gets resent.
                 */
                if (event.getRepeatCount() == 0) {
                    finish();
                    return true;
                }
            }
        }

        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onMenuItemSelected(int featureId, MenuItem item) {
        switch (item.getItemId()) {
        case MENU_ID_EDIT_CONNECTION:
            Connection c = ConnectionLibrary.getDefaultConnection(this);
            EditConnectionActivity.start(this, (c == null) ? -1 :c.getDatabaseId());
            return true;

        case MENU_ID_SETTINGS:
            SettingsActivity.start(this);
            return true;

        case MENU_ID_RECONNECT:
            reconnect();
            return true;
        }

        return super.onMenuItemSelected(featureId, item);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mDestroyed = true;
        mListAdapter.close();
        unregisterReceiver(mBroadcastReceiver);
        unbindService();
    }

    private void init() {
        mDevicesView = findViewById(R.id.DevicesView);
        mConnectionLibrary = ConnectionLibrary.getInstance(this);

        mListAdapter = new DeviceGroupModelAdapter(this);
        mListAdapter.setOnDeviceClickHandler(mOnDeviceClickHandler);

        mViews.mConnectionStatusView = View.inflate(this, R.layout.connection_status, null);
        final ActionBar ab = getActionBar();
        ab.setCustomView(mViews.mConnectionStatusView);
        ab.setDisplayShowCustomEnabled(true);
        ab.setDisplayShowTitleEnabled(false);

        final View status = mViews.mConnectionStatusView;
        mViews.mConnectingView = status.findViewById(R.id.ConnectingView);
        mViews.mConnectingTextView = (TextView) status.findViewById(R.id.ConnectingText);
        mViews.mConnectedView = status.findViewById(R.id.ConnectedView);
        mViews.mDisconnectedView = status.findViewById(R.id.DisconnectedView);
        mViews.mDisconnectedTextView = (TextView) status.findViewById(R.id.DisconnectedTextView);
        mViews.mConnectedHostName = (TextView) status.findViewById(R.id.ConnectedHostNameView);

        mViews.mListView = (AbsListView) mDevicesView.findViewById(R.id.DevicesListView);
        if (mViews.mListView == null) {
            mViews.mListView = (AbsListView) mDevicesView.findViewById(R.id.DevicesGridView);
        }

        mViews.mListView.setAdapter(mListAdapter);

        setUiState(Client.STATE_DISCONNECTED);
    }

    private void reconnect() {
        if (mClientService != null) {
            try {
                mClientService.reconnect();
            }
            catch (RemoteException re) {
            }
        }
    }

    private void bindService() {
        Intent intent = new Intent(this, ClientService.class);
        intent.setAction(ClientService.ACTION_START_SERVICE);
        startService(intent);
        bindService(intent, mServiceConnection, 0);
    }

    private void unbindService() {
        if (mClientService == null) {
            return;
        }

        if (mServiceConnection != null) {
            try {
                unbindService(mServiceConnection);
            }
            catch (Exception e) {
                Log.d("DevicesController", "DevicesController.unbindService: error calling Activity.unbindService()", e);
            }
        }

        mClientService = null;
    }

    private void sendClientMessage(Message message) {
        try {
            if (mClientService != null) {
                mClientService.sendMessage(message);
            }
        }
        catch (RemoteException re) {
            Log.d("DevicesController", "onReconnectClicked", re);
        }
    }

    private String getConnectedHostnameString() {
        Connection c = ConnectionLibrary.getDefaultConnection(this);

        if (c != null) {
            return String.format(" @ %s", c.getAlias());
        }

        return null;
    }

    private void setUiState(int newState) {
        int progressState = View.GONE;
        int connectedState = View.GONE;
        int disconnectedState = View.GONE;
        int listViewState = View.GONE;
        String progressString = "";
        String disconnectedString = "";

        switch (newState) {
        case Client.STATE_CONNECTING:
            progressState = View.VISIBLE;
            progressString = getString(R.string.status_connecting);
            mViews.mConnectedHostName.setText(getConnectedHostnameString());
            break;

        case Client.STATE_CONNECTED:
            listViewState = View.VISIBLE;
            connectedState = View.VISIBLE;
            mViews.mConnectedHostName.setText(getConnectedHostnameString());
            mViews.mConnectedView.setOnClickListener(null);
            mListAdapter.notifyDataSetChanged();
            break;

        case Client.STATE_AUTHENTICATING:
            progressState = View.VISIBLE;
            progressString = getString(R.string.status_authenticating);
            break;

        case Client.STATE_DISCONNECTED:
            disconnectedState = View.VISIBLE;
            mViews.mDisconnectedView.setOnClickListener(mOnReconnectClicked);
            mListAdapter.notifyDataSetInvalidated();

            if ((mConnectionLibrary != null) && (mConnectionLibrary.count() == 0)) {
                disconnectedString = getString(R.string.status_tap_to_setup);
            }
            else {
                disconnectedString = getString(R.string.status_tap_to_reconnect);
            }
        }

        mViews.mConnectingView.setVisibility(progressState);
        mViews.mConnectingTextView.setText(progressString);
        mViews.mConnectedView.setVisibility(connectedState);
        mViews.mDisconnectedView.setVisibility(disconnectedState);
        mViews.mDisconnectedTextView.setText(disconnectedString);
        mViews.mListView.setVisibility(listViewState);
    }

    private void onAuthenticationFailed() {
        if (mPaused) {
            return;
        }

        DialogInterface.OnClickListener yesClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                EditConnectionActivity.start(
                    DevicesActivity.this,
                    ConnectionLibrary.getDefaultConnection(DevicesActivity.this).getDatabaseId());
            }
        };

        AlertDialog.Builder builder =
            new AlertDialog.Builder(DevicesActivity.this);

        builder.setPositiveButton(R.string.button_yes, yesClickListener);
        builder.setNegativeButton(R.string.button_no, null);
        builder.setTitle(R.string.dlg_incorrect_pw_title);
        builder.setMessage(R.string.dlg_incorrect_pw_desc);
        builder.show();
    }

    private void updateUiFromClientServiceState() {
        if (mClientService != null) {
            try {
                final int state = mClientService.getState();

                setUiState(state); // set initial state

                if (state == Client.STATE_DISCONNECTED) {
                    mClientService.reconnect();
                }
            }
            catch (RemoteException re) {
                Log.d("DevicesController", "serviceConnection.onServiceConnected", re);
            }
        }
    }

    private void showLightDimDialog(final Lamp lampDevice) {
        View dimView = getLayoutInflater().inflate(R.layout.dim_lamp, null, false);
        final SeekBar seekBar = (SeekBar) dimView.findViewById(R.id.DimLampSeekBar);

        seekBar.setMax(100);
        seekBar.setProgress(lampDevice.getBrightness());

        DialogInterface.OnClickListener okClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                int dim = seekBar.getProgress();
                sendClientMessage(new SetLampBrightness(lampDevice, dim));
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setPositiveButton(R.string.button_ok, okClickListener);
        builder.setNegativeButton(R.string.button_cancel, null);
        builder.setTitle(getString(R.string.dlg_lamp_brightness_title));
        builder.setView(dimView);
        builder.show();
    }

    private void confirmClearAlert(final SecuritySensor sensor) {
        if (sensor.getStatus() != DeviceStatus.ON) {
            return;
        }

        DialogInterface.OnClickListener yesClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                sendClientMessage(new ResetSensorStatus(sensor));
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setPositiveButton(R.string.button_yes, yesClickListener);
        builder.setNegativeButton(R.string.button_no, null);
        builder.setTitle(R.string.dlg_reset_alert_title);
        builder.setMessage(R.string.dlg_reset_alert_desc);
        builder.show();
    }

    private void toggleArmSecuritySensor(final SecuritySensor sensor) {
        if ( ! sensor.isArmed()) {
            sendClientMessage(new ArmSensor(sensor, true));
            return;
        }

        DialogInterface.OnClickListener yesClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                sendClientMessage(new ArmSensor(sensor, false));
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setPositiveButton(R.string.button_yes, yesClickListener);
        builder.setNegativeButton(R.string.button_no, null);
        builder.setTitle(R.string.dlg_disarm_title);
        builder.setMessage(R.string.dlg_disarm_desc);
        builder.show();
    }

    private void onDeviceItemClicked(Device device) {
        final String address = device.getAddress();

        final BaseDeviceModel deviceModel = mListAdapter.getDeviceModel();
        if (!deviceModel.isUpdating(address)) {
            deviceModel.setUpdating(address);
            mListAdapter.notifyDataSetChanged();
        }

        int newStatus = (device.getStatus() == DeviceStatus.ON)
            ? DeviceStatus.OFF
            : DeviceStatus.ON;

        sendClientMessage(new SetDeviceStatus(device, newStatus));
    }

    private void onSecuritySensorItemClicked(SecuritySensor sensor) {
        if (sensor.isTripped()) {
            confirmClearAlert(sensor);
        }
        else {
            toggleArmSecuritySensor(sensor);
        }
    }

    private void checkEnableTranslucency() {
        SharedPreferences prefs =
            PreferenceManager.getDefaultSharedPreferences(this);

        final String key = getString(R.string.pref_translucency_enabled);

        final boolean supportedOs = (android.os.Build.VERSION.SDK_INT >= 5);
        final boolean enabled = prefs.getBoolean(key, false);

        if (supportedOs && enabled) {
            setTheme(R.style.DeviceActivityTranslucentTheme);

            final int flags = WindowManager.LayoutParams.FLAG_DIM_BEHIND;
            getWindow().setFlags(flags, flags);

            WindowManager.LayoutParams params = getWindow().getAttributes();
            params.dimAmount = 0.45f;
            params.alpha = 1.0f;
            getWindow().setAttributes(params);
        }
        else {
            setTheme(R.style.DeviceActivityTheme);
        }
    }

    private void checkFirstRun() {
        if ( ! sFirstRunChecked) {
            if (mConnectionLibrary.count() <= 0) {
                EditConnectionActivity.startFirstRun(this);
                sFirstRunChecked = true;
            }
        }
    }

    private ServiceConnection mServiceConnection = new ServiceConnection() {
        public void onServiceConnected(ComponentName name, final IBinder service) {
            Log.i(TAG, "ClientService bound to Activity");

            mClientService = IClientService.Stub.asInterface(service);
            mServiceDisconnected = false;

            if (mDestroyed) {
                unbindService();
            }
            else {
                updateUiFromClientServiceState();
            }
        }

        public void onServiceDisconnected(ComponentName name) {
            Log.i(TAG, "ClientService unbound from Activity");
            mServiceDisconnected = true;
        }
    };

    private BroadcastReceiver mBroadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();

            if (ClientService.ACTION_AUTHENTICATION_FAILED.equals(action)) {
                onAuthenticationFailed();
            }
            else if (ClientService.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                final int state = intent.getIntExtra(
                    ClientService.EXTRA_CONNECTION_STATE,
                    Client.STATE_DISCONNECTED);

                setUiState(state);
            }
            else if (SettingsActivity.ACTION_TRANSLUCENCY_TOGGLED.equals(action)) {
                finish();
            }
        }
    };

    private BaseDeviceModelAdapter.OnDeviceClickHandler mOnDeviceClickHandler =
        new BaseDeviceModelAdapter.OnDeviceClickHandler() {
            @Override
            public void onDeviceClicked(Device device) {
                switch (device.getType()) {
                    case DeviceType.SECURITY_SENSOR:
                        onSecuritySensorItemClicked((SecuritySensor) device);
                        break;

                    default:
                        onDeviceItemClicked(device);
                        break;
                }
            }

            @Override
            public boolean onDeviceLongClicked(Device device) {
                if ((device.getType() == DeviceType.LAMP)
                        && (device.getStatus() == DeviceStatus.ON)) {
                    showLightDimDialog((Lamp) device);
                    return true;
                }

                return false;
            }

            @Override
            public void onGroupToggleClicked(Group group, boolean checked) {

            }
        };

    private OnClickListener mOnReconnectClicked = new OnClickListener() {
        public void onClick(View view) {
            try {
                if (mClientService != null) {
                    if (mConnectionLibrary.count() > 0) {
                        mClientService.reconnect();
                    }
                    else {
                        EditConnectionActivity.start(DevicesActivity.this);
                    }
                }
            }
            catch (RemoteException re) {
                Log.d("DevicesController", "onReconnectClicked", re);
            }
        }
    };
}