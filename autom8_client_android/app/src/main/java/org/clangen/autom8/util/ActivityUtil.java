package org.clangen.autom8.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.res.Configuration;

/**
 * Created by clangen on 8/10/14.
 */
public class ActivityUtil {
    public static boolean isLandscape(Context context) {
        return context.getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
    }

    public static boolean registerReceiver(Context context, BroadcastReceiver receiver, IntentFilter filter) {
        try {
            context.getApplicationContext().registerReceiver(receiver, filter);
            return true;
        }
        catch (Exception ex) {
            return false;
        }
    }

    public static boolean unregisterReceiver(Context context, BroadcastReceiver receiver) {
        try {
            context.getApplicationContext().unregisterReceiver(receiver);
            return true;
        }
        catch (Exception ex) {
            return false;
        }
    }

}
