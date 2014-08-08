package org.clangen.autom8.ui.adapter;

import android.app.Service;
import android.content.Context;
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
import org.clangen.autom8.ui.model.BaseDeviceModel;
import org.clangen.autom8.ui.model.DeviceListModel;

/**
 * Created by clangen on 8/7/14.
 */
public abstract class BaseDeviceModelAdapter extends BaseAdapter {
    private Context mContext;
    private BaseDeviceModel mDeviceModel;
    private LayoutInflater mLayoutInflater;

    protected static class ItemViewHolder {
        public View mMainContent;
        public View mSeparator;
        public TextView mSeparatorText;
        public TextView mModuleInfoView;
        public TextView mLabelView;
        public View mUpdatingView;
        public TextView mStatusText;
    }

    public BaseDeviceModelAdapter(Context context) {
        mContext = context;
        mLayoutInflater = (LayoutInflater) mContext.getSystemService(Service.LAYOUT_INFLATER_SERVICE);
    }

    protected void setModel(BaseDeviceModel deviceModel) {
        mDeviceModel = deviceModel;
        mDeviceModel.setOnChangedListener(mOnDeviceModelChanged);
    }

    public BaseDeviceModel getDeviceModel() {
        return mDeviceModel;
    }

    public void close() {
        mDeviceModel.close();
    }

    public int getCount() {
        return (mDeviceModel == null ? 0 : mDeviceModel.size());
    }

    public Object getItem(int position) {
        return (mDeviceModel == null ? null : mDeviceModel.get(position));
    }

    public long getItemId(int position) {
        return position;
    }

    public View getView(int position, View convertView, ViewGroup parent) {
        if ((convertView == null) || (convertView.getId() != R.id.DeviceItemView)) {
            convertView = mLayoutInflater.inflate(R.layout.device_item, null, false);

            ItemViewHolder holder = new ItemViewHolder();
            holder.mMainContent = convertView.findViewById(R.id.DeviceItemMainContent);
            holder.mSeparator = convertView.findViewById(R.id.DeviceItemSeparator);
            holder.mSeparatorText = (TextView) convertView.findViewById(R.id.DeviceItemSeparatorText);
            holder.mStatusText = (TextView) convertView.findViewById(R.id.DeviceItemStatusViewText);
            holder.mLabelView = (TextView) convertView.findViewById(R.id.DeviceItemLabelView);
            holder.mModuleInfoView = (TextView) convertView.findViewById(R.id.DeviceItemModuleInfoView);
            holder.mUpdatingView = convertView.findViewById(R.id.DeviceItemUpdatingView);

            convertView.setTag(holder);
        }

        if (mDeviceModel != null) {
            bindDeviceToView(convertView, mDeviceModel.get(position), position);
        }

        return convertView;
    }

    protected void bindDeviceToView(View deviceView, Device device, int position) {
        ItemViewHolder holder = (ItemViewHolder) deviceView.getTag();

        holder.mLabelView.setText(device.getLabel());
        holder.mStatusText.setTextSize(18.0f);

        // String.format() is very inefficient
        holder.mModuleInfoView.setText(
            deviceTypeToString(device.getType()) + " " + device.getAddress()
        );

        if (mDeviceModel.isUpdating(device.getAddress())) {
            holder.mUpdatingView.setVisibility(View.VISIBLE);
            holder.mStatusText.setVisibility(View.GONE);

            holder.mMainContent.setBackgroundResource(
                device.getStatus() == DeviceStatus.ON
                    ? android.R.drawable.list_selector_background
                    : R.drawable.device_item_on_background
            );
        }
        else {
            holder.mUpdatingView.setVisibility(View.GONE);
            holder.mStatusText.setVisibility(View.VISIBLE);

            switch (device.getType()) {
                case DeviceType.SECURITY_SENSOR:
                    applySensorStyle((SecuritySensor) device, deviceView);
                    break;

                default:
                    applyDefaultStyle(device, deviceView);
                    break;
            }
        }
    }

    protected void applyDefaultStyle(Device device, View itemView) {
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

    protected void applySensorStyle(SecuritySensor sensor, View itemView) {
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

    protected String deviceTypeToString(int deviceType) {
        switch (deviceType) {
            case DeviceType.LAMP: return mContext.getString(R.string.device_type_lamp);
            case DeviceType.APPLIANCE: return mContext.getString(R.string.device_type_appliance);
            case DeviceType.SECURITY_SENSOR: return mContext.getString(R.string.device_type_sensor);
            default: return mContext.getString(R.string.device_type_unknown);
        }
    }

    protected void onDeviceModelChanged() {
        notifyDataSetChanged();
    }

    private DeviceListModel.OnChangedListener mOnDeviceModelChanged =
        new DeviceListModel.OnChangedListener() {
            public void onChanged() {
                onDeviceModelChanged();
            }
        };
}
