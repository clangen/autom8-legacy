package org.clangen.autom8.ui;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.DeviceLibraryFactory;
import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

/**
 * This class is very similar to a Cursor that automatically requeries
 * itself as the backing data changes.
 * <p/>
 * We don't actually use a Cursor because every Device instance has
 * a potentially different set of fields. This may be rethought in
 * the future, but should work fine for hundreds to thousands of
 * devices.
 * @author avatar
 *
 */
public class DeviceModel {
    private static final String TAG = "DeviceModel";

    private List<Device> mDevices = new ArrayList<Device>();
    private HashSet<String> mUpdatingSet;
    private HashMap<String, Integer> mAddressToIndexMap;
    private DeviceLibrary mLibrary;
    private OnChangedListener mListener;
    private Context mContext;

    private static final IntentFilter LIBRARY_INTENTS;

    static {
        LIBRARY_INTENTS = new IntentFilter();
        LIBRARY_INTENTS.addAction(DeviceLibrary.ACTION_DEVICE_LIBRARY_CLEARED);
        LIBRARY_INTENTS.addAction(DeviceLibrary.ACTION_DEVICE_LIBRARY_REFRESHED);
        LIBRARY_INTENTS.addAction(DeviceLibrary.ACTION_DEVICE_UPDATED);
    }

    public interface OnChangedListener {
        void onChanged();
        void onSensorChanged(String address);
    }

    public DeviceModel(Context context, OnChangedListener listener) {
        if (listener == null) {
            throw new IllegalArgumentException("ChangedListener cannot be null");
        }

        mContext = context.getApplicationContext();
        mContext.registerReceiver(mLibraryIntentHandler, LIBRARY_INTENTS);
        mLibrary = DeviceLibraryFactory.getInstance(context);
        mListener = listener;
        mUpdatingSet = new HashSet<String>();
        mAddressToIndexMap = new HashMap<String, Integer>();

        requery();
    }

    public void close() {
        mContext.unregisterReceiver(mLibraryIntentHandler);
    }

    public int size() {
        return mDevices.size();
    }

    public Device get(int position) {
        return mDevices.get(position);
    }

    public Device get(String address) {
        Device result = null;
        Integer index = mAddressToIndexMap.get(address);

        if (index != null) {
            result = mDevices.get(index);
        }

        return result;
    }

    public void setUpdating(String address) {
        mUpdatingSet.add(address);
    }

    public boolean isUpdating(String address) {
        return mUpdatingSet.contains(address);
    }

    private void requery() {
        mAddressToIndexMap.clear();
        mUpdatingSet.clear();
        mDevices = mLibrary.getDevices();

        int i = 0;
        for (Device device : mDevices) {
            mAddressToIndexMap.put(device.getAddress(), i++);
        }
    }

    private Device requeryDevice(String address) throws IndexOutOfBoundsException {
        Integer index = mAddressToIndexMap.get(address);

        if (index == null) {
            throw new IndexOutOfBoundsException();
        }

        Device oldDevice = mDevices.get(index);
        Device newDevice = mLibrary.getDeviceByAddress(address);
        Device result;

        if (oldDevice.getDisplayPriority() != newDevice.getDisplayPriority()) {
            requery();
            result = mDevices.get(mAddressToIndexMap.get(address));
        }
        else {
            mDevices.set(index, newDevice);
            result = newDevice;
        }

        if (result != null && result.getType() == DeviceType.SECURITY_SENSOR) {
            mListener.onSensorChanged(result.getAddress());
        }

        return result;
    }

    private BroadcastReceiver mLibraryIntentHandler = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();
            Log.i(TAG, "Handling event: " + action);

            if (DeviceLibrary.ACTION_DEVICE_LIBRARY_CLEARED.equals(action)) {
                mDevices.clear();
                mAddressToIndexMap.clear();
            }
            else if (DeviceLibrary.ACTION_DEVICE_LIBRARY_REFRESHED.equals(action)) {
                requery();
            }
            else if (DeviceLibrary.ACTION_DEVICE_UPDATED.equals(action)) {
                String address = intent.getStringExtra(DeviceLibrary.EXTRA_DEVICE_ADDRESS);
                if (address != null && address.length() > 0) {
                    Log.i(TAG, "address of updated device: " + address);
                    mUpdatingSet.remove(address);
                    requeryDevice(address);
                }
                else {
                    requery();
                }
            }
            else {
                return;
            }

            mListener.onChanged();
        }
    };
}
