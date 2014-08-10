package org.clangen.autom8.ui.fragment;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Fragment;
import android.content.DialogInterface;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.RemoteException;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.SeekBar;

import org.clangen.autom8.R;
import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceStatus;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.DeviceUtil;
import org.clangen.autom8.device.Group;
import org.clangen.autom8.device.Lamp;
import org.clangen.autom8.device.SecuritySensor;
import org.clangen.autom8.net.Message;
import org.clangen.autom8.net.request.ArmSensor;
import org.clangen.autom8.net.request.ResetSensorStatus;
import org.clangen.autom8.net.request.SetDeviceStatus;
import org.clangen.autom8.net.request.SetLampBrightness;
import org.clangen.autom8.service.IClientService;
import org.clangen.autom8.ui.activity.AdapterType;
import org.clangen.autom8.ui.adapter.BaseDeviceModelAdapter;
import org.clangen.autom8.ui.adapter.DeviceGroupModelAdapter;
import org.clangen.autom8.ui.adapter.DeviceListModelAdapter;
import org.clangen.autom8.ui.model.BaseDeviceModel;

/**
 * does stuff
 * Created by avatar on 8/9/2014.
 */
public class DeviceModelFragment extends Fragment {
//    private final static String TAG = "DeviceModelFragment";
    private static final String ADAPTER_TYPE = "org.clangen.autom8.AdapterType";


    private IClientService mClientService;
    private BaseDeviceModelAdapter mListAdapter;
    private LayoutInflater mInflater;
    private View mView;
    private AbsListView mListView;
    private AdapterType mAdapterType = AdapterType.Flat;

    public DeviceModelFragment(AdapterType type) {
        super();
        mAdapterType = type;
    }

    public DeviceModelFragment() {
        super();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (savedInstanceState != null) {
            mAdapterType = AdapterType.fromId(savedInstanceState.getInt(ADAPTER_TYPE, 0));
        }
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putInt(ADAPTER_TYPE, mAdapterType.getId());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        mListAdapter.close();
        mListView.setAdapter(null);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return init(inflater);
    }

    public void setClientService(IClientService service) {
        mClientService = service;
    }

    private View init(LayoutInflater inflater) {
        mInflater = inflater;

        mView = inflater.inflate(R.layout.devices, null);

        mListView = (AbsListView) mView.findViewById(R.id.DevicesListView);
        if (mListView == null) {
            mListView = (AbsListView) mView.findViewById(R.id.DevicesGridView);
        }

        resetListAdapter();

        return mView;
    }

    private void resetListAdapter() {
        if (mListAdapter != null) {
            mListAdapter.setOnDeviceClickHandler(null);
        }

        final Activity a = getActivity();
        if (isLandscape()) {
            mListAdapter = new DeviceListModelAdapter(a);
        }
        else if (mAdapterType == AdapterType.Flat) {
            mListAdapter = new DeviceListModelAdapter(a);
        }
        else if (mAdapterType == AdapterType.Grouped) {
            mListAdapter = new DeviceGroupModelAdapter(a);
        }
        else {
            throw new RuntimeException("unsupported adapter type requested??");
        }

        mListAdapter.setOnDeviceClickHandler(mOnDeviceClickHandler);
        mListView.setAdapter(mListAdapter);
        mListAdapter.notifyDataSetChanged();
    }

    protected boolean sendClientMessage(Message message) {
        try {
            if (mClientService != null) {
                mClientService.sendMessage(message);
                return true;
            }
        }
        catch (RemoteException re) {
            Log.d("DevicesController", "onReconnectClicked", re);
        }

        return false;
    }

    private void showLightDimDialog(final Lamp lampDevice) {
        View dimView = mInflater.inflate(R.layout.dim_lamp, null, false);
        final SeekBar seekBar = (SeekBar) dimView.findViewById(R.id.DimLampSeekBar);

        seekBar.setMax(100);
        seekBar.setProgress(lampDevice.getBrightness());

        DialogInterface.OnClickListener okClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                int dim = seekBar.getProgress();
                sendClientMessage(new SetLampBrightness(lampDevice, dim));
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
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

        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setPositiveButton(R.string.button_yes, yesClickListener);
        builder.setNegativeButton(R.string.button_no, null);
        builder.setTitle(R.string.dlg_reset_alert_title);
        builder.setMessage(R.string.dlg_reset_alert_desc);
        builder.show();
    }

    private void toggleArmSecuritySensor(final SecuritySensor sensor) {
        if (!sensor.isArmed()) {
            sendClientMessage(new ArmSensor(sensor, true));
            return;
        }

        DialogInterface.OnClickListener yesClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                sendClientMessage(new ArmSensor(sensor, false));
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
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

    private boolean isLandscape() {
        return getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
    }

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
                    int status = checked ? DeviceStatus.ON : DeviceStatus.OFF;

                    for (Device device : group) {
                        if (DeviceUtil.isDeviceToggleable(device) && device.getStatus() != status) {
                            sendClientMessage(new SetDeviceStatus(device, status));
                        }
                    }
                }
            };
}
