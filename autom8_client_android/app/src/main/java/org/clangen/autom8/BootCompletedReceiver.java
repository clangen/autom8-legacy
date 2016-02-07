package org.clangen.autom8;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import org.clangen.autom8.service.ClientService;

public class BootCompletedReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(context);
        if (prefs.getBoolean(context.getString(R.string.pref_start_at_boot), false)) {
            intent = new Intent(context, ClientService.class);
            intent.setAction(ClientService.ACTION_START_SERVICE);
            context.startService(intent);
        }
    }
}
