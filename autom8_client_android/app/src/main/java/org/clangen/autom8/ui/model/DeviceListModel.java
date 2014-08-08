package org.clangen.autom8.ui.model;

import android.content.Context;

import org.clangen.autom8.device.Device;

import java.util.ArrayList;
import java.util.List;

public class DeviceListModel extends DeviceModelBase {
    private static final String TAG = "DeviceListModel";

    private List<Device> mDevices = new ArrayList<Device>();

    public DeviceListModel(Context context) {
        super(context);
    }

    public DeviceListModel(Context context, OnChangedListener listener) {
        super(context, listener);
    }

    @Override
    protected void onRequery() {
        mDevices = getDeviceLibrary().getDeviceList();
    }

    @Override
    public int size() {
        return mDevices.size();
    }

    @Override
    public Device get(int position) {
        return mDevices.get(position);
    }

    @Override
    public Device get(String address) {
        return getDeviceLibrary().getDeviceByAddress(address);
    }
}
