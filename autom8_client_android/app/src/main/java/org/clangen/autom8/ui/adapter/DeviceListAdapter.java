package org.clangen.autom8.ui.adapter;

import android.app.Activity;
import android.content.res.Resources;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceStatus;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.SecuritySensor;
import org.clangen.autom8.ui.model.DeviceListModel;

/**
 * Created by clangen on 8/7/14.
 */
public class DeviceListAdapter extends BaseAdapter {
    private Activity mContext;
    private DeviceListModel mDeviceListModel;

    private static class ItemViewHolder {
        public View mMainContent;
        public TextView mSeparator;
        public TextView mModuleInfoView;
        public TextView mLabelView;
        public View mUpdatingView;
        public TextView mStatusText;
    }

    public DeviceListAdapter(Activity activity) {
        mContext = activity;
    }

    public void setDeviceListModel(DeviceListModel model) {
        if (mDeviceListModel != null && mDeviceListModel != model) {
            mDeviceListModel.setOnChangedListener(null);
        }

        mDeviceListModel = model;
        mDeviceListModel.setOnChangedListener(mOnDeviceModelChanged);
        notifyDataSetInvalidated();
    }

    public int getCount() {
        return (mDeviceListModel == null ? 0 : mDeviceListModel.size());
    }

    public Object getItem(int position) {
        return null;
    }

    public long getItemId(int position) {
        return position;
    }

    public View getView(int position, View convertView, ViewGroup parent) {
        if ((convertView == null) || (convertView.getId() != R.id.DeviceItemView)) {
            LayoutInflater inflater = mContext.getLayoutInflater();
            convertView = inflater.inflate(R.layout.device_item, null, false);

            ItemViewHolder holder = new ItemViewHolder();
            holder.mMainContent = convertView.findViewById(R.id.DeviceItemMainContent);
            holder.mSeparator = (TextView) convertView.findViewById(R.id.DeviceItemSeparator);
            holder.mStatusText = (TextView) convertView.findViewById(R.id.DeviceItemStatusViewText);
            holder.mLabelView = (TextView) convertView.findViewById(R.id.DeviceItemLabelView);
            holder.mModuleInfoView = (TextView) convertView.findViewById(R.id.DeviceItemModuleInfoView);
            holder.mUpdatingView = convertView.findViewById(R.id.DeviceItemUpdatingView);

            convertView.setTag(holder);
        }

        if (mDeviceListModel == null) {
            return convertView;
        }

        Device device = mDeviceListModel.get(position);

        ItemViewHolder holder = (ItemViewHolder) convertView.getTag();

        holder.mLabelView.setText(device.getLabel());
        holder.mStatusText.setTextSize(18.0f);

        // String.format() is very inefficient
        holder.mModuleInfoView.setText(
                deviceTypeToString(device.getType()) + " " + device.getAddress());

        if (mDeviceListModel.isUpdating(device.getAddress())) {
            // device status is UPDATING?
            holder.mUpdatingView.setVisibility(View.VISIBLE);
            holder.mStatusText.setVisibility(View.GONE);

            holder.mMainContent.setBackgroundResource(
                device.getStatus() == DeviceStatus.ON
                    ? android.R.drawable.list_selector_background
                    : R.drawable.device_item_on_background);
        }
        else {
            holder.mUpdatingView.setVisibility(View.GONE);
            holder.mStatusText.setVisibility(View.VISIBLE);

            switch (device.getType()) {
                case DeviceType.SECURITY_SENSOR:
                    applySensorStyle((SecuritySensor) device, convertView);
                    break;

                default:
                    applyDefaultStyle(device, convertView);
                    break;
            }
        }

        return convertView;
    }

    private void applyDefaultStyle(Device device, View itemView) {
        final ItemViewHolder holder = (ItemViewHolder) itemView.getTag();
        final Resources r = mContext.getResources();

        int status = R.string.device_status_off;

        switch (device.getStatus()) {
            case DeviceStatus.ON:
                status = R.string.device_status_on;
                holder.mStatusText.setTextColor(r.getColor(R.color.device_row_on_status_text));
                holder.mStatusText.setBackgroundColor(r.getColor(R.color.device_row_on_status_bg));
                holder.mMainContent.setBackgroundResource(R.drawable.device_item_on_background);
                break;

            case DeviceStatus.OFF:
                holder.mStatusText.setTextColor(r.getColor(R.color.device_row_off_status_text));
                holder.mStatusText.setBackgroundColor(r.getColor(R.color.device_row_off_status_bg));
                holder.mMainContent.setBackgroundResource(android.R.drawable.list_selector_background);
                break;
        }

        holder.mStatusText.setText(status);
    }

    private void applySensorStyle(SecuritySensor sensor, View itemView) {
        final ItemViewHolder holder = (ItemViewHolder) itemView.getTag();
        final Resources r = mContext.getResources();

        int status = R.string.device_status_off;

        if (sensor.isTripped()) {
            status = R.string.device_status_alert;
            holder.mStatusText.setTextColor(r.getColor(R.color.device_row_alert_status_text));
            holder.mStatusText.setBackgroundColor(r.getColor(R.color.device_row_alert_status_bg));
            holder.mMainContent.setBackgroundResource(R.drawable.device_item_alert_background);
        }
        else if (sensor.isArmed()) {
            status = R.string.device_status_armed;
            holder.mStatusText.setTextSize(16.0f);
            holder.mStatusText.setTextColor(r.getColor(R.color.device_row_on_status_text));
            holder.mStatusText.setBackgroundColor(r.getColor(R.color.device_row_on_status_bg));
            holder.mMainContent.setBackgroundResource(R.drawable.device_item_on_background);
        }
        else {
            holder.mStatusText.setTextColor(r.getColor(R.color.device_row_off_status_text));
            holder.mStatusText.setBackgroundColor(r.getColor(R.color.device_row_off_status_bg));
            holder.mMainContent.setBackgroundResource(android.R.drawable.list_selector_background);
        }

        holder.mStatusText.setText(status);
    }

    private String deviceTypeToString(int deviceType) {
        switch (deviceType) {
            case DeviceType.LAMP: return mContext.getString(R.string.device_type_lamp);
            case DeviceType.APPLIANCE: return mContext.getString(R.string.device_type_appliance);
            case DeviceType.SECURITY_SENSOR: return mContext.getString(R.string.device_type_sensor);
            default: return mContext.getString(R.string.device_type_unknown);
        }
    }

    private DeviceListModel.OnChangedListener mOnDeviceModelChanged =
        new DeviceListModel.OnChangedListener() {
            public void onChanged() {
                notifyDataSetChanged();
            }
        };

}
