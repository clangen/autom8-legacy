package org.clangen.autom8.device.impl.json;

import android.content.Context;
import android.util.Log;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceFactory;
import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.DisplayPriorityComparator;
import org.clangen.autom8.device.Group;
import org.clangen.autom8.device.GroupComparator;
import org.clangen.autom8.device.SecuritySensor;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

/**
 * Created by clangen on 8/6/14.
 */
public class InMemoryDeviceLibrary extends DeviceLibrary {
    private static final DisplayPriorityComparator PRIORITY_COMPARATOR = new DisplayPriorityComparator();
    private static final GroupComparator GROUP_COMPARATOR = new GroupComparator();

    private static final String TAG = "InMemoryDeviceLibrary";
    private ArrayList<Device> mDevices = new ArrayList<Device>();
    private ArrayList<Device> mSortedDevices;
    private ArrayList<Group> mGroups;

    public InMemoryDeviceLibrary(Context context) {
        super(context);
    }

    @Override
    public synchronized List<Device> getDeviceList() {
        if (mSortedDevices == null) {
            mSortedDevices = new ArrayList<Device>(mDevices);
            Collections.sort(mSortedDevices, PRIORITY_COMPARATOR);
        }

        return new ArrayList<Device>(mSortedDevices);
    }

    @Override
    public synchronized List<Group> getDeviceGroups() {
        if (mGroups == null) {
            HashMap<String, ArrayList<Device>> aggregated =
              new HashMap<String, ArrayList<Device>>();

            /* collect a hash map of device lists. the key in this hash
            map will be the group name, the value will the the list of
            devices associated with the group. */
            ArrayList<Device> list;
            for (Device device : mDevices) {
                for (String groupName : device.getGroups()) {
                    list = aggregated.get(groupName);

                    if (list == null) {
                        list = new ArrayList<Device>();
                        aggregated.put(groupName, list);
                    }

                    list.add(device);
                }
            }

            /* the groups have been aggregated together, now let's convert
            it into a sorted structure. first, use the data within the
            hash maps to actually create the Group instances, then sort. */
            ArrayList<Group> sorted = new ArrayList<Group>();
            for (String groupName : aggregated.keySet()) {
                sorted.add(new Group(groupName, aggregated.get(groupName)));
            }

            Collections.sort(sorted, GROUP_COMPARATOR);
            mGroups = sorted;
        }

        return new ArrayList<Group>(mGroups);
    }

    @Override
    public void setFromDeviceListJSON(JSONObject devices) {
        ArrayList<Device> result = new ArrayList<Device>();
        boolean success = false;

        try {
            JSONArray deviceArray = devices.getJSONArray("devices");

            for (int i = 0; i < deviceArray.length(); i++) {
                result.add(DeviceFactory.fromJson(deviceArray.getJSONObject(i)));
            }

            success = true;
        }
        catch(JSONException jex) {
            Log.e(TAG, "setFromDeviceListJSON failed!");
        }

        if (success) {
            synchronized(this) {
                mDevices = result;
                markDirty();
                onReloaded();
            }
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
            markDirty();
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

    private void markDirty() {
        synchronized(this) {
            mSortedDevices = null;
            mGroups = null;
        }
    }
}
