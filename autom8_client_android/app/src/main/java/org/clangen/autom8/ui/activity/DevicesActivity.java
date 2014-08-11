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
import android.support.v4.view.PagerTabStrip;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.WindowManager;

import org.clangen.autom8.R;
import org.clangen.autom8.connection.Connection;
import org.clangen.autom8.connection.ConnectionLibrary;
import org.clangen.autom8.net.Client;
import org.clangen.autom8.service.ClientService;
import org.clangen.autom8.service.IClientService;
import org.clangen.autom8.ui.adapter.DevicesPagerAdapter;
import org.clangen.autom8.ui.view.ActionBarStatusView;

public class DevicesActivity extends Activity implements ClientServiceProvider {
    private final static String TAG = "DevicesActivity";

    private final static int MENU_ID_EDIT_CONNECTION = 0;
    private final static int MENU_ID_SETTINGS = 1;
    private final static int MENU_ID_RECONNECT = 2;
    private final static int MENU_ID_ADAPTER_TYPE = 3;

    private final static IntentFilter INTENT_FILTER;
    private static boolean sFirstRunChecked;

    private ActionBarStatusView mStatusView;
    private ViewPager mDevicesPager;
    private ConnectionLibrary mConnectionLibrary;
    private IClientService mClientService;
    private DevicesPagerAdapter mPagerAdapter;
    private boolean mPaused = true, mDestroyed;
    private boolean mServiceDisconnected;

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
        setContentView(R.layout.devices_pager);
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
    public IClientService getClientService() {
        return mClientService;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mDestroyed = true;
        mPagerAdapter.onDestroy();
        unregisterReceiver(mBroadcastReceiver);
        unbindService();
    }

    private void init() {
        mConnectionLibrary = ConnectionLibrary.getInstance(this);

        mPagerAdapter = new DevicesPagerAdapter(this);
        mDevicesPager = (ViewPager) findViewById(R.id.devices_pager);
        mDevicesPager.setAdapter(mPagerAdapter);

        PagerTabStrip strip = (PagerTabStrip) findViewById(R.id.devices_pager_tab_strip);
        strip.setDrawFullUnderline(false);
        strip.setVisibility(View.GONE);

        mStatusView = new ActionBarStatusView(this);
        mStatusView.setOnActionBarStatusViewEventListener(mStatusViewEventListener);

        final ActionBar ab = getActionBar();
        ab.setCustomView(mStatusView);
        ab.setDisplayShowCustomEnabled(true);
        ab.setDisplayShowTitleEnabled(false);

        setUiState(Client.STATE_DISCONNECTED);
    }

// CAL TODO
//    private void writeAdapterTypePreference() {
//        SharedPreferences.Editor editor =
//            PreferenceManager.getDefaultSharedPreferences(this).edit();
//
//
//        editor.putInt(getString(R.string.pref_devices_view_type), mAdapterType.getId());
//
//        editor.apply();
//    }

// CAL TODO
//    public void readAdapterTypeFromPreferences() {
//        mAdapterType = AdapterType.fromId(
//            PreferenceManager.getDefaultSharedPreferences(this).getInt(
//                getString(R.string.pref_devices_view_type), AdapterType.Flat.getId()
//            )
//        );
//    }

    private void reconnect() {
        if (mClientService != null) {
            try {
                mClientService.reconnect();
            }
            catch (RemoteException re) {
                Log.d(TAG, "reconnected failed with a RemoteException");
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

    private void setUiState(int newState) {
        mStatusView.setClientServerState(newState);
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

        AlertDialog.Builder builder = new AlertDialog.Builder(DevicesActivity.this);
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
                setUiState(state);

                if (state == Client.STATE_DISCONNECTED) {
                    mClientService.reconnect();
                }
            }
            catch (RemoteException re) {
                Log.d(TAG, "serviceConnection.onServiceConnected", re);
            }
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
        if (!sFirstRunChecked) {
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

    private ActionBarStatusView.OnActionBarStatusViewEventListener mStatusViewEventListener =
        new ActionBarStatusView.OnActionBarStatusViewEventListener() {
            @Override
            public void onReconnectClicked() {
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
                    Log.d(TAG, "onReconnectClicked", re);
                }
            }
        };

}