package org.clangen.autom8.ui.activity;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.TextView;

import org.clangen.autom8.R;
import org.clangen.autom8.connection.Connection;
import org.clangen.autom8.connection.ConnectionLibrary;
import org.clangen.autom8.util.ToolbarUtil;

public class VerifyConnectionActivity extends AppCompatActivity {
    public static final int REQUEST_CODE = 1024;

    private ConnectionLibrary mConnectionLibrary;
    private Connection mConnection;

    public static void start(Activity parentActivity) {
        Intent intent = new Intent();
        intent.setClass(parentActivity, VerifyConnectionActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.setAction(Intent.ACTION_VIEW);
        parentActivity.startActivityForResult(intent, REQUEST_CODE);
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mConnectionLibrary = ConnectionLibrary.getInstance(this);
        setResult(RESULT_CANCELED);

        setContentView(R.layout.verify_connection);

        ToolbarUtil.initSolid(this);
    }

    @Override
    public void onResume() {
        super.onResume();

        mConnection = ConnectionLibrary.getDefaultConnection(this);

        if (mConnection == null) {

            finish();
        }
        else {
            initViews();
        }
    }

    private void initViews() {
        ((TextView) findViewById(R.id.VerifyFingerprint)).setText(mConnection.getFingerprint());

        findViewById(R.id.VerifyButton).setOnClickListener(
            new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    mConnectionLibrary.markConnectionVerified(mConnection.getDatabaseId());
                    setResult(RESULT_OK);
                    finish();
                }
            });
    }
}

