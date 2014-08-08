package org.clangen.autom8.ui.model;

import android.content.Context;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.Group;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created by clangen on 8/7/14.
 */
public class DeviceGroupModel extends BaseDeviceModel {
    private ArrayList<Device> mFlattened = new ArrayList<Device>();
    private List<Group> mGroups = new ArrayList<Group>();
    private HashMap<Integer, String> mDelimiters = new HashMap<Integer, String>();

    public DeviceGroupModel(Context context) {
        super(context);
    }

    public DeviceGroupModel(Context context, OnChangedListener listener) {
        super(context, listener);
    }

    @Override
    protected void onRequery() {
        mGroups = getDeviceLibrary().getDeviceGroups();

        mFlattened.clear();
        for (Group group : mGroups) {
            mDelimiters.put(mFlattened.size(), group.getName());

            for (Device device : group) {
                mFlattened.add(device);
            }
        }
    }

    @Override
    public int size() {
        return mFlattened.size();
    }

    @Override
    public Device get(int position) {
        return mFlattened.get(position);
    }

    public String getDelimiterText(int position) {
        return mDelimiters.get(position);
    }

    @Override
    public Device get(String address) {
        return getDeviceLibrary().getDeviceByAddress(address);
    }
}
