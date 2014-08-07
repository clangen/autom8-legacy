package org.clangen.autom8.device.impl.json;

import android.content.Context;
import android.util.Log;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceFactory;
import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.SecuritySensor;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Created by clangen on 8/6/14.
 */
public class InMemoryDeviceLibrary extends DeviceLibrary {
    private static final DisplayPriorityComparator PRIORITY_COMPARATOR = new DisplayPriorityComparator();
    private static final String TAG = "InMemoryDeviceLibrary";
    private ArrayList<Device> mDevices = new ArrayList<Device>();

    public InMemoryDeviceLibrary(Context context) {
        super(context);
    }

    @Override
    public synchronized List<Device> getDevices() {
        ArrayList<Device> result;

        synchronized(this) {
            result = new ArrayList<Device>(mDevices);

        }

        Collections.sort(result, PRIORITY_COMPARATOR);
        return result;
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
    public synchronized int getAlertCount() {
        int alerts = 0;

        SecuritySensor s;
        for (Device d : mDevices) {
            if (d.getType() == DeviceType.SECURITY_SENSOR) {
                s = (SecuritySensor) d;
                if (s.isArmed() && s.isTripped()) {
                    alerts += 1;
                }
            }
        }

        return alerts;
    }

    @Override
    public boolean update(JSONObject rawJson) {
        Device updatedDevice;
        try {
            updatedDevice = DeviceFactory.fromJson(rawJson);
        }
        catch (JSONException ex) {
            Log.e(TAG, "update() failed to parse JSON");
            return false;
        }

        boolean success = false;
        final String address = updatedDevice.getAddress();

        synchronized(this) {
            Device device = getDeviceByAddress(address);
            if (device != null) {
                device.swap(updatedDevice);
                success = true;
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
