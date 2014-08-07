package org.clangen.autom8.device.impl.json;

import android.content.Context;
import android.util.Log;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceFactory;
import org.clangen.autom8.device.DeviceLibrary;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by clangen on 8/6/14.
 */
public class InMemoryDeviceLibrary extends DeviceLibrary {
    private static final String TAG = "InMemoryDeviceLibrary";
    private ArrayList<Device> mDevices = new ArrayList<Device>();

    public InMemoryDeviceLibrary(Context context) {
        super(context);
    }

    @Override
    public synchronized List<Device> getDevices() {
        return new ArrayList<Device>(mDevices);
    }

    @Override
    public void setFromDeviceListJSON(JSONObject devices) {
        ArrayList<Device> result = new ArrayList<Device>();

        try {
            JSONArray deviceArray = devices.getJSONArray("devices");

            for (int i = 0; i < deviceArray.length(); i++) {
                result.add(DeviceFactory.fromJson(deviceArray.getJSONObject(i)));
            }

            onReloaded();
        }
        catch(JSONException jex) {
            Log.e(TAG, "setFromDeviceListJSON failed!");
        }

        synchronized(this) {
            mDevices = result;
        }
    }

    @Override
    public synchronized void clear() {
        mDevices = new ArrayList<Device>();
        onCleared();
    }

    @Override
    public int getAlertCount() {
        return 0;
    }

    @Override
    public boolean update(JSONObject rawJson) {
        Device updatedDevice;
        try {
            updatedDevice = (JsonDevice) DeviceFactory.fromJson(rawJson);
        }
        catch (JSONException ex) {
            Log.e(TAG, "update() failed to parse JSON");
            return false;
        }

        boolean success = false;
        final String address = updatedDevice.getAddress();
        synchronized(this) {
            for (int i = 0; i < mDevices.size(); i++) {
                Device d = mDevices.get(i);

                if (d.getAddress().equals(address)) {
                    mDevices.set(i, updatedDevice);
                    success = true;
                    break;
                }
            }
        }

        if (success) {
            onDeviceUpdated(address);
        }

        return success;
    }

    @Override
    public synchronized Device getDeviceByAddress(String address) {
        for (Device d : mDevices) {
            if (d.getAddress().equals(address)) {
                return d;
            }
        }

        return null;
    }
}