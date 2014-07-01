package org.clangen.autom8.db.device;

import java.util.HashMap;

import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceStatus;
import org.clangen.autom8.device.DeviceType;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

public class JSONDevice implements Device {
    private static final String LABEL_NODE = "label";
    private static final String TYPE_NODE = "type";
    private static final String ADDRESS_NODE = "address";
    private static final String STATUS_NODE = "status";
    private static final String ATTRIBUTES_NODE = "attributes";

    private String mAddress, mLabel;
    private int mStatus = DeviceStatus.UNKNOWN, mType = DeviceType.UNKNOWN;
    private boolean mValid = false;
    private HashMap<String, String> mAttributes = new HashMap<String, String>();

    public JSONDevice(JSONObject json) {
        mValid = createFromJSON(json);
    }

    public boolean isValid() {
        return mValid;
    }

    public String getAddress() {
        return mAddress;
    }

    public String getLabel() {
        return mLabel;
    }

    public int getStatus() {
        return mStatus;
    }

    public int getType() {
        return mType;
    }

    @SuppressWarnings("unchecked")
    public HashMap<String, String> getAttributes() {
        return (HashMap<String, String>) mAttributes.clone();
    }

    private boolean createFromJSON(JSONObject json) {
        try {
            mAddress = json.getString(ADDRESS_NODE);
            mLabel = json.getString(LABEL_NODE);
            mStatus = json.getInt(STATUS_NODE);
            mType = json.getInt(TYPE_NODE);

            JSONObject attributes = json.getJSONObject(ATTRIBUTES_NODE);
            JSONArray keys = attributes.names();

            if (keys != null) {
                String key;
                for (int i = 0; i < keys.length(); i++) {
                    key = keys.getString(i);
                    mAttributes.put(key, attributes.get(key).toString());
                }
            }

            return true;
        }
        catch (JSONException ex) {
            Log.i("JSONDevice", "unable to parse device from JSON!", ex);
        }

        return false;
    }

    public String getAttribute(String key) {
        return mAttributes.get(key);
    }

    public int getDisplayPriority() {
        return 0;
    }
}
