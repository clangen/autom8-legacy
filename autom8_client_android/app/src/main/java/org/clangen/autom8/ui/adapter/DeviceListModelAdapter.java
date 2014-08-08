package org.clangen.autom8.ui.adapter;

import android.content.Context;

import org.clangen.autom8.ui.model.DeviceListModel;

/**
 * Created by clangen on 8/7/14.
 */
public class DeviceListModelAdapter extends BaseDeviceModelAdapter {
    public DeviceListModelAdapter(Context context) {
        super(context);
        setModel(new DeviceListModel(context));
    }
}
