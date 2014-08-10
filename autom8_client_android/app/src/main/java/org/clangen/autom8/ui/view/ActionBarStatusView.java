package org.clangen.autom8.ui.view;

import android.content.Context;
import android.os.RemoteException;
import android.text.Layout;
import android.util.AttributeSet;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.connection.Connection;
import org.clangen.autom8.connection.ConnectionLibrary;
import org.clangen.autom8.net.Client;
import org.clangen.autom8.ui.activity.EditConnectionActivity;

/**
 * Created by avatar on 8/10/2014.
 */
public class ActionBarStatusView extends FrameLayout {
    private android.view.View mConnectingView;
    private View mConnectedView;
    private View mDisconnectedView;
    private TextView mConnectedHostName;
    private TextView mConnectingTextView;
    private TextView mDisconnectedTextView;
    private ConnectionLibrary mConnectionLibrary;
    private OnActionBarStatusViewEventListener mListener;

    public interface OnActionBarStatusViewEventListener {
        public void onReconnectClicked();
    }

    public ActionBarStatusView(Context context) {
        super(context);
        init();
    }

    public ActionBarStatusView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ActionBarStatusView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init();
    }

    public void setOnActionBarStatusViewEventListener(
        OnActionBarStatusViewEventListener listener)
    {
        mListener = listener;
    }

     public void setClientServerState(int newState) {
        int progressState = View.GONE;
        int connectedState = View.GONE;
        int disconnectedState = View.GONE;
        String progressString = "";
        String disconnectedString = "";
        final Context context = getContext();

        switch (newState) {
            case Client.STATE_CONNECTING:
                progressState = View.VISIBLE;
                progressString = context.getString(R.string.status_connecting);
                mConnectedHostName.setText(getConnectedHostnameString());
                break;

            case Client.STATE_CONNECTED:
                connectedState = View.VISIBLE;
                mConnectedHostName.setText(getConnectedHostnameString());
                mConnectedView.setOnClickListener(null);
                break;

            case Client.STATE_AUTHENTICATING:
                progressState = View.VISIBLE;
                progressString = context.getString(R.string.status_authenticating);
                break;

            case Client.STATE_DISCONNECTED:
                disconnectedState = View.VISIBLE;
                mDisconnectedView.setOnClickListener(mOnReconnectClicked);

                if ((mConnectionLibrary != null) && (mConnectionLibrary.count() == 0)) {
                    disconnectedString = context.getString(R.string.status_tap_to_setup);
                }
                else {
                    disconnectedString = context.getString(R.string.status_tap_to_reconnect);
                }
        }

        mConnectingView.setVisibility(progressState);
        mConnectingTextView.setText(progressString);
        mConnectedView.setVisibility(connectedState);
        mDisconnectedView.setVisibility(disconnectedState);
        mDisconnectedTextView.setText(disconnectedString);
    }

    private void init() {
        mConnectionLibrary = ConnectionLibrary.getInstance(getContext());

        LayoutInflater inflater  = (LayoutInflater)
            getContext().getSystemService(Context.LAYOUT_INFLATER_SERVICE);

        inflater.inflate(R.layout.connection_status, this, true);
        mConnectingView = findViewById(R.id.ConnectingView);
        mConnectingTextView = (TextView) findViewById(R.id.ConnectingText);
        mConnectedView = findViewById(R.id.ConnectedView);
        mDisconnectedView = findViewById(R.id.DisconnectedView);
        mDisconnectedTextView = (TextView) findViewById(R.id.DisconnectedTextView);
        mConnectedHostName = (TextView) findViewById(R.id.ConnectedHostNameView);
    }

    private String getConnectedHostnameString() {
        Connection c = ConnectionLibrary.getDefaultConnection(getContext());

        if (c != null) {
            return String.format(" @ %s", c.getAlias());
        }

        return null;
    }

    private OnClickListener mOnReconnectClicked = new OnClickListener() {
        public void onClick(View view) {
            if (mListener != null) {
                mListener.onReconnectClicked();
            }
        }
    };
}