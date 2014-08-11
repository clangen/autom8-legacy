package org.clangen.autom8.ui.dialog;

import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DialogFragment;
import android.content.DialogInterface;
import android.os.Bundle;

import org.clangen.autom8.R;

/**
 * Created by clangen on 8/10/14.
 */
public class ConfirmClearAlertDialog extends DialogFragment {
    public static final String TAG = "ConfirmClearAlertDialog";
    public static final String EXTRA_SENSOR_ADDRESS = "org.clangen.autom8.SENSOR_ADDRESS";

    private String mAddress;
    private OnConfirmClearListener mListener;

    public interface OnConfirmClearListener {
        void onConfirmClear(String address);
    }

    public ConfirmClearAlertDialog() {
    }

    public void setOnConfirmClearListener(OnConfirmClearListener listener) {
        mListener = listener;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        mAddress = getArguments().getString(EXTRA_SENSOR_ADDRESS);

        DialogInterface.OnClickListener yesClickListener = new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                if (mListener != null) {
                    mListener.onConfirmClear(mAddress);
                }
            }
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setPositiveButton(R.string.button_yes, yesClickListener);
        builder.setNegativeButton(R.string.button_no, null);
        builder.setTitle(R.string.dlg_reset_alert_title);
        builder.setMessage(R.string.dlg_reset_alert_desc);
        return builder.create();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
    }
}
