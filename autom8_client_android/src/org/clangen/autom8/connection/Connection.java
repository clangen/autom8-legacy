package org.clangen.autom8.connection;

public class Connection {
    private String mAlias, mHost, mPassword;
    private int mPort = 0;
    private Long mDatabaseId = null;
    private volatile int mHashCode = 0;

    public Connection(String alias, String host, int port, String password) {
        mAlias = alias;
        mHost = host;
        mPort = port;
        mPassword = password;
    }

    public Connection(String alias, String host, int port, String password, Long databaseId) {
        this(alias, host, port, password);
        mDatabaseId = databaseId;
    }

    public String getAlias() {
        return mAlias;
    }

    public String getHost() {
        return mHost;
    }

    public int getPort() {
        return mPort;
    }

    public String getPassword() {
        return mPassword;
    }

    public Long getDatabaseId() {
        return mDatabaseId;
    }

    @Override
    public boolean equals(Object o) {
        if ( ! (o instanceof Connection)) {
            return false;
        }

        Connection connection = (Connection) o;

        return (
           (connection.getDatabaseId() == mDatabaseId)
        && (connection.getAlias().equals(mAlias))
        && (connection.getHost().equals(mHost))
        && (connection.getPort() == mPort)
        && (connection.getPassword().equals(mPassword)));
    }

    @Override
    public int hashCode() {
        int result = mHashCode;

        if (result == 0) {
            result = 17;

            if (mDatabaseId != 0) {
                result = 31 * result + (int) (mDatabaseId ^ (mDatabaseId >>> 32));
            }

            result = 31 * result + mPort;
            result = 31 * result + mAlias.hashCode();
            result = 31 * result + mHost.hashCode();
            result = 31 * result + mPassword.hashCode();

            mHashCode = result;
        }

        return result;
    }
}
