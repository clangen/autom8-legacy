package org.clangen.autom8.ui;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.DeviceLibraryFactory;

import java.util.ArrayList;
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
public class DeviceListModel {
    private static final String TAG = "DeviceModel";

    private List<Device> mDevices = new ArrayList<Device>();
    private HashSet<String> mUpdatingSet;
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
    }

    public DeviceListModel(Context context, OnChangedListener listener) {
        if (listener == null) {
            throw new IllegalArgumentException("ChangedListener cannot be null");
        }

        mContext = context.getApplicationContext();
        mContext.registerReceiver(mLibraryIntentHandler, LIBRARY_INTENTS);
        mLibrary = DeviceLibraryFactory.getInstance(context);
        mListener = listener;
        mUpdatingSet = new HashSet<String>();

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
        return mLibrary.getDeviceByAddress(address);
    }

    public void setUpdating(String address) {
        mUpdatingSet.add(address);
    }

    public boolean isUpdating(String address) {
        return mUpdatingSet.contains(address);
    }

    private void requery() {
        mUpdatingSet.clear();
        mDevices = mLibrary.getDeviceList();
        mListener.onChanged();
    }

    private BroadcastReceiver mLibraryIntentHandler = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Log.i(TAG, "Handling event: " + intent.getAction());
            requery();
        }
    };
}
