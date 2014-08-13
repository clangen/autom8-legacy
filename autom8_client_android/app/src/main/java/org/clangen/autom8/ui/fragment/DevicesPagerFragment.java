package org.clangen.autom8.ui.fragment;

import android.app.Fragment;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.RemoteException;
import android.preference.PreferenceManager;
import android.support.v4.view.PagerTabStrip;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.connection.ConnectionLibrary;
import org.clangen.autom8.net.Client;
import org.clangen.autom8.service.IClientService;
import org.clangen.autom8.ui.activity.AdapterType;
import org.clangen.autom8.ui.activity.ClientServiceProvider;
import org.clangen.autom8.ui.activity.DevicesActivity;
import org.clangen.autom8.ui.adapter.DevicesPagerAdapter;
import org.clangen.autom8.util.ActivityUtil;

/**
 * Created by clangen on 8/12/14.
 */
public class DevicesPagerFragment extends Fragment {
    public static final String TAG = "DevicesPagerFragment";

    private Handler mHandler = new Handler();
    private ConnectionLibrary mConnectionLibrary;
    private View mView;
    private Overlay mOverlay = new Overlay();
    private ViewPager mDevicesPagerView;
    private DevicesPagerAdapter mDevicesPagerAdapter;

    private static class Overlay {
        View mView;
        Button mButton;
        TextView mText;

        public void show(boolean show) {
            mView.setVisibility(show ? View.VISIBLE : View.GONE);
            mButton.setVisibility(View.GONE);
            mText.setVisibility(View.GONE);
        }

        public void showText() {
            this.show(true);
            mText.setVisibility(View.VISIBLE);
            mButton.setVisibility(View.GONE);
        }

        public void showButton(int stringId) {
            this.show(true);
            mText.setVisibility(View.GONE);
            mButton.setVisibility(View.VISIBLE);
            mButton.setText(stringId);
        }

        public void empty() {
            this.show(true);
            mText.setVisibility(View.GONE);
            mButton.setVisibility(View.GONE);
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mConnectionLibrary = ConnectionLibrary.getInstance(getActivity());

        mView = inflater.inflate(R.layout.devices_pager, container);

        mDevicesPagerAdapter = new DevicesPagerAdapter(getActivity());
        mDevicesPagerAdapter.setOnInitializedListener(mOnPagerInitializedListener);

        mDevicesPagerView = (ViewPager) mView.findViewById(R.id.devices_pager);
        mDevicesPagerView.setAdapter(mDevicesPagerAdapter);

        mOverlay.mView = mView.findViewById(R.id.NotConnectedOverlay);
        mOverlay.mButton = (Button) mView.findViewById(R.id.NotConectedOverlayButton);
        mOverlay.mText = (TextView) mView.findViewById(R.id.NotConnectedText);

        mOverlay.mButton.setOnClickListener(mOverlayButtonClickListener);

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
        mHandler.removeCallbacks(mAsyncShowDisconnected);

        switch (state) {
            case Client.STATE_AUTHENTICATING:
            case Client.STATE_CONNECTING:
                mOverlay.empty();
                break;

            case Client.STATE_CONNECTED:
                mOverlay.show(false);
                break;

            case Client.STATE_DISCONNECTED:
                mOverlay.empty();
                mHandler.postDelayed(mAsyncShowDisconnected, 500);
                break;
        }
    }

    private Runnable mAsyncShowDisconnected = new Runnable() {
        public void run() {
            final IClientService svc = ((ClientServiceProvider) getActivity()).getClientService();
            try {
                if (svc != null && svc.getState() == Client.STATE_DISCONNECTED) {
                    final int buttonText = mConnectionLibrary.count() == 0 ?
                            R.string.pager_overlay_setup_connection :
                            R.string.pager_overlay_reconnect;

                    mOverlay.showButton(buttonText);
                }
            }
            catch (RemoteException ex) {
                Log.d(TAG, "ClientService call failed");
            }
        }
    };

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

    private View.OnClickListener mOverlayButtonClickListener =
        new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ((DevicesActivity) getActivity()).reconnectOrSetupConnection();
            }
        };

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
