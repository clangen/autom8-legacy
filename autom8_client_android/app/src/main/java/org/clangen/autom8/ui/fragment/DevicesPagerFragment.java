package org.clangen.autom8.ui.fragment;

import android.app.Fragment;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.view.PagerTabStrip;
import android.support.v4.view.ViewPager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.net.Client;
import org.clangen.autom8.ui.activity.AdapterType;
import org.clangen.autom8.ui.adapter.DevicesPagerAdapter;
import org.clangen.autom8.util.ActivityUtil;

/**
 * Created by clangen on 8/12/14.
 */
public class DevicesPagerFragment extends Fragment {
    public static final String TAG = "DevicesPagerFragment";

    private View mView;
    private View mNotConnectedOverlay;
    private TextView mNotConnectedText;
    private ViewPager mDevicesPagerView;
    private DevicesPagerAdapter mDevicesPagerAdapter;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mView = inflater.inflate(R.layout.devices_pager, container);

        mDevicesPagerAdapter = new DevicesPagerAdapter(getActivity());
        mDevicesPagerAdapter.setOnInitializedListener(mOnPagerInitializedListener);

        mDevicesPagerView = (ViewPager) mView.findViewById(R.id.devices_pager);
        mDevicesPagerView.setAdapter(mDevicesPagerAdapter);

        mNotConnectedOverlay = mView.findViewById(R.id.NotConnectedOverlay);
        mNotConnectedText = (TextView) mView.findViewById(R.id.NotConnectedText);

        PagerTabStrip strip = (PagerTabStrip) mView.findViewById(R.id.devices_pager_tab_strip);
        strip.setDrawFullUnderline(false);
        strip.setVisibility(View.GONE);

        return mView;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        mDevicesPagerAdapter.onDestroy();

        /* for now, only portrait mode supports saving/restoring the last
        selected AdapterType; group mode is not supported in landscape */
        if (ActivityUtil.isLandscape(getActivity())) {
            writeAdapterTypePreference();
        }
    }

    public void setClientServerState(int state) {
        switch (state) {
            case Client.STATE_AUTHENTICATING:
            case Client.STATE_CONNECTING:
                mNotConnectedOverlay.setVisibility(View.VISIBLE);
                mNotConnectedText.setText(R.string.list_overlay_connecting);
                break;

            case Client.STATE_CONNECTED:
                mNotConnectedOverlay.setVisibility(View.GONE);
                break;

            case Client.STATE_DISCONNECTED:
                mNotConnectedOverlay.setVisibility(View.VISIBLE);
                mNotConnectedText.setText(R.string.list_overlay_not_connected);
                break;
        }
    }

    private void writeAdapterTypePreference() {
        SharedPreferences.Editor editor =
                PreferenceManager.getDefaultSharedPreferences(getActivity()).edit();

        int position = mDevicesPagerView.getCurrentItem();
        final int typeId = mDevicesPagerAdapter.getAdapterType(position).getId();

        editor.putInt(getString(R.string.pref_devices_view_type), typeId);

        editor.apply();
    }

    public AdapterType readAdapterTypeFromPreferences() {
        return AdapterType.fromId(
                PreferenceManager.getDefaultSharedPreferences(getActivity()).getInt(
                        getString(R.string.pref_devices_view_type), AdapterType.Flat.getId()
                )
        );
    }

    private DevicesPagerAdapter.OnResetListener mOnPagerInitializedListener =
        new DevicesPagerAdapter.OnResetListener() {
            @Override
            public void onReset() {
                int index = mDevicesPagerAdapter.getIndexForType(readAdapterTypeFromPreferences());
                if (index != -1) {
                    mDevicesPagerView.setCurrentItem(index, true);
                }
            }
        };
}
