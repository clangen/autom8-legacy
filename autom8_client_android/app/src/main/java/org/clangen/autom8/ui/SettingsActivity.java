package org.clangen.autom8.ui;

import org.clangen.autom8.R;
import org.clangen.autom8.receiver.CameraButtonReceiver;
import org.clangen.autom8.service.ClientService;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.preference.Preference;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;
import android.preference.PreferenceScreen;
import android.util.Log;

public class SettingsActivity extends PreferenceActivity {
    public static final String ACTION_TRANSLUCENCY_TOGGLED = "org.clangen.autom8.ACTION_TRANSLUCENCY_TOGGLED";

    public static void start(Activity parentActivity) {
        Intent intent = new Intent();
        intent.setClass(parentActivity, SettingsActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.setAction(Intent.ACTION_VIEW);

        parentActivity.startActivityForResult(intent, 0);
    }

    @Override
    public boolean onPreferenceTreeClick(
        PreferenceScreen preferenceScreen, Preference p)
    {
        boolean result = super.onPreferenceTreeClick(preferenceScreen, p);

        if (p == getTranslucencyPreference()) {
            showTranslucencyToggledDialog();
        }
        else if (p == getPeristencePreference()) {
            final Intent intent = new Intent(this, ClientService.class);
            intent.setAction(ClientService.ACTION_START_SERVICE);
            startService(intent);
        }
        else if (p == getConnectionManagerPreference()) {
            ConnectionManagerActivity.start(this);
            return false;
        }
        else if (p == getCameraButtonPreference()) {
            onCameraButtonPreferenceChanged();
        }

        sendBroadcast(new Intent(ClientService.ACTION_RELOAD_SETTINGS));

        return result;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        addPreferencesFromResource(R.layout.settings);
        checkEnableTranslucency();
        setVersionPreference();
    }

    @Override
    protected void onDestroy() {
        sendBroadcast(new Intent(ClientService.ACTION_RELOAD_SETTINGS));
        super.onDestroy();
    }

    private void checkEnableTranslucency() {
        getTranslucencyPreference()
            .setEnabled(android.os.Build.VERSION.SDK_INT >= 5);
    }

    private Preference getTranslucencyPreference() {
        return findPreference(getString(R.string.pref_translucency_enabled));
    }

    private Preference getCameraButtonPreference() {
        return findPreference(getString(R.string.pref_use_camera_button));
    }

    private Preference getPeristencePreference() {
        return findPreference(getString(R.string.pref_run_in_background));
    }

    private Preference getConnectionManagerPreference() {
        return findPreference(getString(R.string.pref_connection_manager));
    }

    private void showTranslucencyToggledDialog() {
//        AlertDialog.Builder b = new AlertDialog.Builder(this);
//        b.setTitle(R.string.dlg_translucency_warning_title);
//        b.setMessage(R.string.dlg_translucency_warning_desc);
//        b.setPositiveButton(R.string.button_ok, null);
//        b.create().show();
        sendBroadcast(new Intent(ACTION_TRANSLUCENCY_TOGGLED));
    }

    private void onCameraButtonPreferenceChanged() {
        SharedPreferences prefs =
            PreferenceManager.getDefaultSharedPreferences(this);

        final boolean enabled = prefs.getBoolean(
            getString(R.string.pref_use_camera_button), false);

        final int newState = enabled
            ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

        PackageManager pm = getPackageManager();
        ComponentName cn = new ComponentName(this, CameraButtonReceiver.class);
        pm.setComponentEnabledSetting(cn, newState, PackageManager.DONT_KILL_APP);
    }

    private void setVersionPreference() {
        PackageManager pm = getPackageManager();

        try {
            PackageInfo info = pm.getPackageInfo(getPackageName(), 0);

            Preference p = findPreference(getString(R.string.pref_version));
            if (p != null) {
                p.setSummary(
                    getString(R.string.setting_version_desc,
                    info.versionName,
                    info.versionCode));
            }
        }
        catch (Exception ex) {
            Log.i("SettingsActivity", "failed to get version");
        }
    }
}
