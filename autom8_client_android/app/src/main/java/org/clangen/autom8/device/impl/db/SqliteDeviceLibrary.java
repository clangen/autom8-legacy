package org.clangen.autom8.device.impl.db;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteDatabase.CursorFactory;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.Device;
import org.clangen.autom8.device.DeviceFactory;
import org.clangen.autom8.device.DeviceType;
import org.clangen.autom8.device.impl.json.JsonDevice;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class SqliteDeviceLibrary extends DeviceLibrary {
    private SQLiteDatabase mDatabase;

    private static final String TAG = "SqliteDeviceLibrary";

    private static final String DEVICE_TABLE = "device";
    private static final String ID_COLUMN = "id";
    private static final String TYPE_COLUMN = "type";
    private static final String STATUS_COLUMN = "status";
    private static final String ADDRESS_COLUMN = "address";
    private static final String LABEL_COLUMN = "label";

    private static final String ATTRIBUTE_TABLE = "attribute";
    private static final String DEVICE_ID_COLUMN = "device_id";
    private static final String KEY_COLUMN = "key";
    private static final String VALUE_COLUMN = "value";

    private static final String DISPLAY_PRIORITY_TABLE = "display_priority";
    private static final String PRIORITY_COLUMN = "priority";

    private static final String DISPLAY_ORDER_VIEW = "display_order";

    public SqliteDeviceLibrary(Context context) {
        super(context);
        init();
    }

    public List<Device> getDevices() {
        ArrayList<Device> result = new ArrayList<Device>();

        Cursor cursor = mDatabase.query(
            DISPLAY_ORDER_VIEW,
            null,
            null,               // where clause
            null,               // where clause's binded parameters
            null,               // group by
            null,               // having
            PRIORITY_COLUMN + " DESC");   // order by

        if (cursor != null) {
            try {
                while (cursor.moveToNext()) {
                    Device device = createDevice(cursor);
                    if (device != null) {
                        result.add(device);
                    }
                }
            }
            finally {
                cursor.close();
            }
        }

        return result;
    }

    public void setFromDeviceListJSON(JSONObject json) {
        internalClear();

        mDatabase.beginTransaction();

        try {
            JSONArray deviceArray = json.getJSONArray("devices");

            for (int i = 0; i < deviceArray.length(); i++) {
                JsonDevice device = new JsonDevice(deviceArray.getJSONObject(i));
                if (device.isValid()) {
                    insertDevice(device);
                }
            }

            mDatabase.setTransactionSuccessful();
        }
        catch (JSONException ex) {
            Log.i("DeviceLibrary", "setFromDeviceListJSON: unable to parse device list", ex);
        }
        finally {
            mDatabase.endTransaction();
            onReloaded();
        }
    }

    public void clear() {
        internalClear();
        onCleared();
    }

    public int getAlertCount() {
        Cursor cursor = mDatabase.query(
            DISPLAY_PRIORITY_TABLE,
            new String[] { "COUNT(*)" },
            String.format("%s=%d", PRIORITY_COLUMN, SECURITY_ALERT_DISPLAY_PRIORITY),
            null, null, null, null);

        return cursorToInt(cursor, 0);
    }

    public boolean update(JSONObject rawDeviceJson) {
        JsonDevice jsonDevice;
        try {
            jsonDevice = (JsonDevice) DeviceFactory.fromJson(rawDeviceJson);
        }
        catch(JSONException ex) {
            Log.e(TAG, "could not parse JSON device");
            return false;
        }

        DbDevice device = (DbDevice) getDeviceByAddress(jsonDevice.getAddress());

        if (device == null) {
            Log.i("DeviceLibrary", "update failed, (device == null)");
            return false;
        }

        long deviceId = device.getId();
        HashMap<String, String> attributes = jsonDevice.getAttributes();

        mDatabase.beginTransaction();
        try {
            if (device != null) {
                ContentValues newValues = contentValuesFromDevice(jsonDevice);
                int rows = mDatabase.update(
                    DEVICE_TABLE,
                    newValues,
                    String.format("%s=%d", ID_COLUMN, deviceId),
                    null);

                if (rows > 0) {
                    // set initial display priority
                    setDeviceDisplayPriority(deviceId, jsonDevice);

                    // device attributes
                    int updated = updateDeviceAttributes(deviceId, attributes);
                    if (updated == attributes.size()) {
                        mDatabase.setTransactionSuccessful();
                        return true;
                    }
                }
            }
        }
        finally {
            mDatabase.endTransaction();
            onDeviceUpdated(jsonDevice.getAddress());
        }

        return false;
    }

    public Device getDeviceByAddress(String address) {
        Cursor cursor = mDatabase.query(
            DISPLAY_ORDER_VIEW,
            null,
            String.format("%s=?", ADDRESS_COLUMN),
            new String[] { address },   // bind
            null,                       // group by
            null,                       // having
            null);                      // order

        try {
            if ((cursor != null) && (cursor.getCount() > 0)) {
                cursor.moveToNext();
                return createDevice(cursor);
            }
        }
        finally {
            cursor.close();
        }

        return null;
    }

    private boolean setDeviceDisplayPriority(long deviceId, JsonDevice device) {
        int priority = SqliteDeviceLibrary.DEFAULT_DISPLAY_PRIORITY;

        if (device.getType() == DeviceType.SECURITY_SENSOR) {
            String armed = device.getAttribute("armed");
            String tripped = device.getAttribute("tripped");

            if (("true".equals(armed)) && ("true".equals(tripped))) {
                priority = SqliteDeviceLibrary.SECURITY_ALERT_DISPLAY_PRIORITY;
            }
        }

        ContentValues values = new ContentValues();
        values.put(DEVICE_ID_COLUMN, deviceId);
        values.put(PRIORITY_COLUMN, priority);
        return (mDatabase.replace(DISPLAY_PRIORITY_TABLE, DEVICE_ID_COLUMN, values) != -1);
    }

    private void internalClear() {
        mDatabase.beginTransaction();
        try {
            mDatabase.delete(DEVICE_TABLE, null, null);
            mDatabase.delete(ATTRIBUTE_TABLE, null, null);
            mDatabase.delete(DISPLAY_PRIORITY_TABLE, null, null);
            mDatabase.setTransactionSuccessful();
        }
        finally {
            mDatabase.endTransaction();
        }
    }

    private boolean insertDevice(JsonDevice device) {
        mDatabase.beginTransaction();
        try {
            // insert the device
            ContentValues values = new ContentValues();
            values.put(TYPE_COLUMN, device.getType());
            values.put(STATUS_COLUMN, device.getStatus());
            values.put(ADDRESS_COLUMN, device.getAddress());
            values.put(LABEL_COLUMN, device.getLabel());
            long id = mDatabase.insert(DEVICE_TABLE, ID_COLUMN, values);

            if (id != -1) {
                // set the attributes
                HashMap<String, String> attributes = device.getAttributes();
                if (updateDeviceAttributes(id, attributes) != attributes.size()) {
                    return false;
                }

                // set initial display priority
                setDeviceDisplayPriority(id, device);

                mDatabase.setTransactionSuccessful();
                return true;
            }
        }
        finally {
            mDatabase.endTransaction();
        }

        return false;
    }

    private boolean setDeviceAttribute(long deviceId, String key, String value) {
        String whereClause = String.format(
            "%s=%d AND %s like ?", DEVICE_ID_COLUMN, deviceId, KEY_COLUMN);

        mDatabase.delete(ATTRIBUTE_TABLE, whereClause, new String[] { key });

        ContentValues contentValues = new ContentValues();
        contentValues.put(DEVICE_ID_COLUMN, deviceId);
        contentValues.put(KEY_COLUMN, key);
        contentValues.put(VALUE_COLUMN, value);
        return (mDatabase.insert(ATTRIBUTE_TABLE,ID_COLUMN, contentValues) != -1);
    }

    private int updateDeviceAttributes(long deviceId, HashMap<String, String> attributes) {
        int count = 0;

        for (String key : attributes.keySet()) {
            if (setDeviceAttribute(deviceId, key, attributes.get(key))) {
                ++count;
            }
        }

        return count;
    }

    private int cursorToInt(Cursor cursor, int defaultValue) {
        if (cursor != null) {
            try {
                if (cursor.getCount() > 0) {
                    cursor.moveToNext();
                    return cursor.getInt(0);
                }
            }
            finally {
                cursor.close();
            }
        }

        return defaultValue;
    }

    private ContentValues contentValuesFromDevice(Device device) {
        ContentValues values = new ContentValues();
        values.put(TYPE_COLUMN, device.getType());
        values.put(STATUS_COLUMN, device.getStatus());
        values.put(ADDRESS_COLUMN, device.getAddress());
        values.put(LABEL_COLUMN, device.getLabel());

        return values;
    }

    private HashMap<String, String> getDeviceAttributes(long deviceId) {
        HashMap<String, String> attributes = new HashMap<String, String>();

        Cursor cursor = mDatabase.query(
            ATTRIBUTE_TABLE,
            new String[] { KEY_COLUMN, VALUE_COLUMN },
            String.format("%s=%d", DEVICE_ID_COLUMN, deviceId),
            null,
            null,
            null,
            null);

        if (cursor != null) {
            try {
                while (cursor.moveToNext()) {
                    attributes.put(cursor.getString(0), cursor.getString(1));
                }
            }
            finally {
                cursor.close();
            }
        }

        return attributes;
    }

    private DbDevice createDevice(Cursor cursor) {
        long deviceId = cursor.getLong(0);
        int type = cursor.getInt(1);
        HashMap<String, String> attributes = getDeviceAttributes(deviceId);
        DbDevice result = null;

        switch (type) {
        case DeviceType.SECURITY_SENSOR:
            result = new DbSecuritySensor();
            break;
        case DeviceType.LAMP:
            result = new DbLamp();
            break;
        default:
            result = new DbDevice();
            break;
        }

        if (result.initialize(cursor, attributes)) {
            return result;
        }

        return null;
    }

    private void init() {
        mDatabase = new DatabaseHelper(mContext, "DeviceLibrary", null, 1).getWritableDatabase();
    }

    private class DatabaseHelper extends SQLiteOpenHelper {
        public DatabaseHelper(Context context, String name, CursorFactory factory, int version) {
            super(context, name, factory, version);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            initializeTables(db);
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            // no upgrades yet
        }

        private void initializeTables(SQLiteDatabase db) {
            // DEVICE table
            String sql =
                "CREATE TABLE IF NOT EXISTS %s (" +
                "  %s INTEGER PRIMARY KEY AUTOINCREMENT," +     // id
                "  %s INTEGER," +                               // type
                "  %s INTEGER," +                               // status
                "  %s STRING," +                                // address
                "  %s STRING);";                                // label

            sql = String.format(sql, DEVICE_TABLE, ID_COLUMN, TYPE_COLUMN,
                    STATUS_COLUMN, ADDRESS_COLUMN, LABEL_COLUMN);

            db.execSQL(sql);

            // ATTRIBUTE TABLE
            sql =
                "CREATE TABLE IF NOT EXISTS %s (" +
                "  %s INTEGER PRIMARY KEY AUTOINCREMENT," +     // id
                "  %s INTEGER," +                               // device_id
                "  %s STRING," +                                // key
                "  %s STRING);";                                // value

            sql = String.format(sql, ATTRIBUTE_TABLE, ID_COLUMN, DEVICE_ID_COLUMN,
                    KEY_COLUMN, VALUE_COLUMN);

            db.execSQL(sql);

            // DISPLAY PRIORITY TABLE
            sql =
                "CREATE TABLE IF NOT EXISTS %s (" +
                "  %s INTEGER PRIMARY KEY," +     // device id
                "  %s INTEGER);";                 // priority

            sql = String.format(sql, DISPLAY_PRIORITY_TABLE, DEVICE_ID_COLUMN, PRIORITY_COLUMN);

            db.execSQL(sql);

            // DISPLAY ORDER VIEW
            sql =
                " CREATE VIEW IF NOT EXISTS %s AS" +
                "  SELECT %s,%s,%s,%s,%s,%s FROM %s" +
                "  LEFT JOIN %s ON %s.%s=%s.%s" +
                "  ORDER BY %s DESC, %s ASC;";

            sql = String.format(sql, DISPLAY_ORDER_VIEW, ID_COLUMN, TYPE_COLUMN,
                STATUS_COLUMN, ADDRESS_COLUMN, LABEL_COLUMN, PRIORITY_COLUMN,
                DEVICE_TABLE, DISPLAY_PRIORITY_TABLE, DEVICE_TABLE, ID_COLUMN,
                DISPLAY_PRIORITY_TABLE, DEVICE_ID_COLUMN, PRIORITY_COLUMN, ADDRESS_COLUMN);

            db.execSQL(sql);

            // ATTRIBUTE KEY INDEX
            sql = "CREATE INDEX IF NOT EXISTS attribute_key_index ON %s (%s)";
            sql = String.format(sql, ATTRIBUTE_TABLE, KEY_COLUMN);
            db.execSQL(sql);
        }
    }
}
