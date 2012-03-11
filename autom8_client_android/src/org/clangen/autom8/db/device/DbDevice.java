package org.clangen.autom8.db.device;

import java.util.HashMap;

import org.clangen.autom8.device.Device;

import android.database.Cursor;

public class DbDevice implements Device {
    private boolean mInitialized = false;
    private long mId;
    private int mType, mStatus, mPriority;
    private String mAddress, mLabel;
    private HashMap<String, String> mAttributes;

    public DbDevice() {
    }

    public final boolean initialize(Cursor cursor, HashMap<String, String> attributes) {
        if (mInitialized) {
            throw new RuntimeException("DbDevice.create(): device already initialized!");
        }

        mAttributes = attributes;
        loadFromCursor(cursor);
        loadExtendedAttributes(attributes);

        mInitialized = true;
        return mInitialized;
    }

    public final long getId() {
        return mId;
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

    public String getAttribute(String key) {
        return mAttributes.get(key);
    }

    public int getDisplayPriority() {
        return mPriority;
    }

    protected void loadExtendedAttributes(HashMap<String, String> attributes) {
    }

    private void loadFromCursor(Cursor cursor) {
        mId = cursor.getLong(0);
        mType = cursor.getInt(1);
        mStatus = cursor.getInt(2);
        mAddress = cursor.getString(3);
        mLabel = cursor.getString(4);
        mPriority = cursor.getInt(5);
    }
}
