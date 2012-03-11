package org.clangen.autom8.receiver;

import org.clangen.autom8.ui.DevicesActivity;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class CameraButtonReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        abortBroadcast();

        final Intent i = new Intent(context, DevicesActivity.class);

        i.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);

        context.startActivity(i);
    }

}
