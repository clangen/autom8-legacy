/********************************************************************************
** Form generated from reading UI file 'autom8_server_qt.ui'
**
** Created: Tue Dec 11 18:02:23 2012
**      by: Qt User Interface Compiler version 4.7.3
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_AUTOM8_SERVER_QT_H
#define UI_AUTOM8_SERVER_QT_H

#include <QtCore/QVariant>
#include <QtGui/QAction>
#include <QtGui/QApplication>
#include <QtGui/QButtonGroup>
#include <QtGui/QFormLayout>
#include <QtGui/QHBoxLayout>
#include <QtGui/QHeaderView>
#include <QtGui/QLabel>
#include <QtGui/QLineEdit>
#include <QtGui/QMainWindow>
#include <QtGui/QPushButton>
#include <QtGui/QSpinBox>
#include <QtGui/QTabWidget>
#include <QtGui/QTreeView>
#include <QtGui/QVBoxLayout>
#include <QtGui/QWidget>

QT_BEGIN_NAMESPACE

class Ui_autom8_server_qtClass
{
public:
    QWidget *centralWidget;
    QVBoxLayout *verticalLayout_2;
    QVBoxLayout *verticalLayout;
    QLabel *ServerStatusLabel;
    QTabWidget *tabWidget;
    QWidget *SettingsTab;
    QVBoxLayout *verticalLayout_3;
    QLabel *label_9;
    QFormLayout *formLayout;
    QLabel *label_5;
    QLabel *VersionLabel;
    QLabel *label_4;
    QLabel *ControllerLabel;
    QLabel *label_3;
    QLabel *FingerprintLabel;
    QLabel *label_2;
    QLabel *label;
    QLineEdit *PasswordLineEdit;
    QSpinBox *PortNumberSpinBox;
    QLabel *label_10;
    QHBoxLayout *horizontalLayout_2;
    QPushButton *AddDeviceButton;
    QPushButton *EditDeviceButton;
    QPushButton *DeleteDeviceButton;
    QTreeView *DevicesListView;
    QWidget *LogTab;
    QVBoxLayout *verticalLayout_4;
    QTreeView *LogListView;
    QPushButton *ClearLogsButton;
    QHBoxLayout *horizontalLayout;
    QPushButton *StartServerButton;
    QPushButton *StopServerButton;

    void setupUi(QMainWindow *autom8_server_qtClass)
    {
        if (autom8_server_qtClass->objectName().isEmpty())
            autom8_server_qtClass->setObjectName(QString::fromUtf8("autom8_server_qtClass"));
        autom8_server_qtClass->resize(444, 482);
        QSizePolicy sizePolicy(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(autom8_server_qtClass->sizePolicy().hasHeightForWidth());
        autom8_server_qtClass->setSizePolicy(sizePolicy);
        centralWidget = new QWidget(autom8_server_qtClass);
        centralWidget->setObjectName(QString::fromUtf8("centralWidget"));
        centralWidget->setEnabled(true);
        sizePolicy.setHeightForWidth(centralWidget->sizePolicy().hasHeightForWidth());
        centralWidget->setSizePolicy(sizePolicy);
        centralWidget->setAutoFillBackground(false);
        verticalLayout_2 = new QVBoxLayout(centralWidget);
        verticalLayout_2->setSpacing(6);
        verticalLayout_2->setContentsMargins(11, 11, 11, 11);
        verticalLayout_2->setObjectName(QString::fromUtf8("verticalLayout_2"));
        verticalLayout = new QVBoxLayout();
        verticalLayout->setSpacing(6);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        verticalLayout->setSizeConstraint(QLayout::SetDefaultConstraint);
        ServerStatusLabel = new QLabel(centralWidget);
        ServerStatusLabel->setObjectName(QString::fromUtf8("ServerStatusLabel"));
        ServerStatusLabel->setAlignment(Qt::AlignCenter);
        ServerStatusLabel->setMargin(4);

        verticalLayout->addWidget(ServerStatusLabel);

        tabWidget = new QTabWidget(centralWidget);
        tabWidget->setObjectName(QString::fromUtf8("tabWidget"));
        SettingsTab = new QWidget();
        SettingsTab->setObjectName(QString::fromUtf8("SettingsTab"));
        verticalLayout_3 = new QVBoxLayout(SettingsTab);
        verticalLayout_3->setSpacing(6);
        verticalLayout_3->setContentsMargins(11, 11, 11, 11);
        verticalLayout_3->setObjectName(QString::fromUtf8("verticalLayout_3"));
        label_9 = new QLabel(SettingsTab);
        label_9->setObjectName(QString::fromUtf8("label_9"));
        QFont font;
        font.setBold(true);
        font.setWeight(75);
        label_9->setFont(font);
        label_9->setAlignment(Qt::AlignCenter);

        verticalLayout_3->addWidget(label_9);

        formLayout = new QFormLayout();
        formLayout->setSpacing(6);
        formLayout->setObjectName(QString::fromUtf8("formLayout"));
        formLayout->setSizeConstraint(QLayout::SetMinimumSize);
        formLayout->setFieldGrowthPolicy(QFormLayout::ExpandingFieldsGrow);
        formLayout->setLabelAlignment(Qt::AlignRight|Qt::AlignTrailing|Qt::AlignVCenter);
        label_5 = new QLabel(SettingsTab);
        label_5->setObjectName(QString::fromUtf8("label_5"));

        formLayout->setWidget(0, QFormLayout::LabelRole, label_5);

        VersionLabel = new QLabel(SettingsTab);
        VersionLabel->setObjectName(QString::fromUtf8("VersionLabel"));

        formLayout->setWidget(0, QFormLayout::FieldRole, VersionLabel);

        label_4 = new QLabel(SettingsTab);
        label_4->setObjectName(QString::fromUtf8("label_4"));

        formLayout->setWidget(1, QFormLayout::LabelRole, label_4);

        ControllerLabel = new QLabel(SettingsTab);
        ControllerLabel->setObjectName(QString::fromUtf8("ControllerLabel"));

        formLayout->setWidget(1, QFormLayout::FieldRole, ControllerLabel);

        label_3 = new QLabel(SettingsTab);
        label_3->setObjectName(QString::fromUtf8("label_3"));

        formLayout->setWidget(2, QFormLayout::LabelRole, label_3);

        FingerprintLabel = new QLabel(SettingsTab);
        FingerprintLabel->setObjectName(QString::fromUtf8("FingerprintLabel"));

        formLayout->setWidget(2, QFormLayout::FieldRole, FingerprintLabel);

        label_2 = new QLabel(SettingsTab);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setAlignment(Qt::AlignLeading|Qt::AlignLeft|Qt::AlignVCenter);

        formLayout->setWidget(3, QFormLayout::LabelRole, label_2);

        label = new QLabel(SettingsTab);
        label->setObjectName(QString::fromUtf8("label"));
        label->setAlignment(Qt::AlignLeading|Qt::AlignLeft|Qt::AlignVCenter);

        formLayout->setWidget(4, QFormLayout::LabelRole, label);

        PasswordLineEdit = new QLineEdit(SettingsTab);
        PasswordLineEdit->setObjectName(QString::fromUtf8("PasswordLineEdit"));
        QSizePolicy sizePolicy1(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(PasswordLineEdit->sizePolicy().hasHeightForWidth());
        PasswordLineEdit->setSizePolicy(sizePolicy1);

        formLayout->setWidget(4, QFormLayout::FieldRole, PasswordLineEdit);

        PortNumberSpinBox = new QSpinBox(SettingsTab);
        PortNumberSpinBox->setObjectName(QString::fromUtf8("PortNumberSpinBox"));
        sizePolicy1.setHeightForWidth(PortNumberSpinBox->sizePolicy().hasHeightForWidth());
        PortNumberSpinBox->setSizePolicy(sizePolicy1);
        PortNumberSpinBox->setMaximum(65535);

        formLayout->setWidget(3, QFormLayout::FieldRole, PortNumberSpinBox);


        verticalLayout_3->addLayout(formLayout);

        label_10 = new QLabel(SettingsTab);
        label_10->setObjectName(QString::fromUtf8("label_10"));
        label_10->setFont(font);
        label_10->setAlignment(Qt::AlignCenter);

        verticalLayout_3->addWidget(label_10);

        horizontalLayout_2 = new QHBoxLayout();
        horizontalLayout_2->setSpacing(6);
        horizontalLayout_2->setObjectName(QString::fromUtf8("horizontalLayout_2"));
        horizontalLayout_2->setSizeConstraint(QLayout::SetNoConstraint);
        AddDeviceButton = new QPushButton(SettingsTab);
        AddDeviceButton->setObjectName(QString::fromUtf8("AddDeviceButton"));

        horizontalLayout_2->addWidget(AddDeviceButton);

        EditDeviceButton = new QPushButton(SettingsTab);
        EditDeviceButton->setObjectName(QString::fromUtf8("EditDeviceButton"));

        horizontalLayout_2->addWidget(EditDeviceButton);

        DeleteDeviceButton = new QPushButton(SettingsTab);
        DeleteDeviceButton->setObjectName(QString::fromUtf8("DeleteDeviceButton"));

        horizontalLayout_2->addWidget(DeleteDeviceButton);


        verticalLayout_3->addLayout(horizontalLayout_2);

        DevicesListView = new QTreeView(SettingsTab);
        DevicesListView->setObjectName(QString::fromUtf8("DevicesListView"));
        DevicesListView->setProperty("showDropIndicator", QVariant(false));
        DevicesListView->setIndentation(0);

        verticalLayout_3->addWidget(DevicesListView);

        tabWidget->addTab(SettingsTab, QString());
        LogTab = new QWidget();
        LogTab->setObjectName(QString::fromUtf8("LogTab"));
        verticalLayout_4 = new QVBoxLayout(LogTab);
        verticalLayout_4->setSpacing(6);
        verticalLayout_4->setContentsMargins(11, 11, 11, 11);
        verticalLayout_4->setObjectName(QString::fromUtf8("verticalLayout_4"));
        LogListView = new QTreeView(LogTab);
        LogListView->setObjectName(QString::fromUtf8("LogListView"));
        LogListView->setIndentation(0);

        verticalLayout_4->addWidget(LogListView);

        ClearLogsButton = new QPushButton(LogTab);
        ClearLogsButton->setObjectName(QString::fromUtf8("ClearLogsButton"));

        verticalLayout_4->addWidget(ClearLogsButton);

        tabWidget->addTab(LogTab, QString());

        verticalLayout->addWidget(tabWidget);

        horizontalLayout = new QHBoxLayout();
        horizontalLayout->setSpacing(6);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        StartServerButton = new QPushButton(centralWidget);
        StartServerButton->setObjectName(QString::fromUtf8("StartServerButton"));

        horizontalLayout->addWidget(StartServerButton);

        StopServerButton = new QPushButton(centralWidget);
        StopServerButton->setObjectName(QString::fromUtf8("StopServerButton"));

        horizontalLayout->addWidget(StopServerButton);


        verticalLayout->addLayout(horizontalLayout);


        verticalLayout_2->addLayout(verticalLayout);

        autom8_server_qtClass->setCentralWidget(centralWidget);
        QWidget::setTabOrder(tabWidget, PortNumberSpinBox);
        QWidget::setTabOrder(PortNumberSpinBox, PasswordLineEdit);
        QWidget::setTabOrder(PasswordLineEdit, AddDeviceButton);
        QWidget::setTabOrder(AddDeviceButton, EditDeviceButton);
        QWidget::setTabOrder(EditDeviceButton, DeleteDeviceButton);
        QWidget::setTabOrder(DeleteDeviceButton, DevicesListView);
        QWidget::setTabOrder(DevicesListView, StartServerButton);
        QWidget::setTabOrder(StartServerButton, StopServerButton);

        retranslateUi(autom8_server_qtClass);

        tabWidget->setCurrentIndex(0);


        QMetaObject::connectSlotsByName(autom8_server_qtClass);
    } // setupUi

    void retranslateUi(QMainWindow *autom8_server_qtClass)
    {
        autom8_server_qtClass->setWindowTitle(QApplication::translate("autom8_server_qtClass", "autom8 server", 0, QApplication::UnicodeUTF8));
        ServerStatusLabel->setText(QApplication::translate("autom8_server_qtClass", "Stop the server to change your settings", 0, QApplication::UnicodeUTF8));
        label_9->setText(QApplication::translate("autom8_server_qtClass", "Server", 0, QApplication::UnicodeUTF8));
        label_5->setText(QApplication::translate("autom8_server_qtClass", "Version:", 0, QApplication::UnicodeUTF8));
        VersionLabel->setText(QApplication::translate("autom8_server_qtClass", "0.3.1", 0, QApplication::UnicodeUTF8));
        label_4->setText(QApplication::translate("autom8_server_qtClass", "Controller:", 0, QApplication::UnicodeUTF8));
        ControllerLabel->setText(QApplication::translate("autom8_server_qtClass", "xxx", 0, QApplication::UnicodeUTF8));
        label_3->setText(QApplication::translate("autom8_server_qtClass", "SSL Fingerprint:", 0, QApplication::UnicodeUTF8));
        FingerprintLabel->setText(QApplication::translate("autom8_server_qtClass", "xxx", 0, QApplication::UnicodeUTF8));
        label_2->setText(QApplication::translate("autom8_server_qtClass", "Port:", 0, QApplication::UnicodeUTF8));
        label->setText(QApplication::translate("autom8_server_qtClass", "Password:", 0, QApplication::UnicodeUTF8));
        label_10->setText(QApplication::translate("autom8_server_qtClass", "Devices", 0, QApplication::UnicodeUTF8));
        AddDeviceButton->setText(QApplication::translate("autom8_server_qtClass", "Add Device", 0, QApplication::UnicodeUTF8));
        EditDeviceButton->setText(QApplication::translate("autom8_server_qtClass", "Edit Device", 0, QApplication::UnicodeUTF8));
        DeleteDeviceButton->setText(QApplication::translate("autom8_server_qtClass", "Delete Device", 0, QApplication::UnicodeUTF8));
        tabWidget->setTabText(tabWidget->indexOf(SettingsTab), QApplication::translate("autom8_server_qtClass", "Settings", 0, QApplication::UnicodeUTF8));
        ClearLogsButton->setText(QApplication::translate("autom8_server_qtClass", "Clear Access Logs", 0, QApplication::UnicodeUTF8));
        tabWidget->setTabText(tabWidget->indexOf(LogTab), QApplication::translate("autom8_server_qtClass", "Access Logs", 0, QApplication::UnicodeUTF8));
        StartServerButton->setText(QApplication::translate("autom8_server_qtClass", "Start Server", 0, QApplication::UnicodeUTF8));
        StopServerButton->setText(QApplication::translate("autom8_server_qtClass", "Stop Server", 0, QApplication::UnicodeUTF8));
    } // retranslateUi

};

namespace Ui {
    class autom8_server_qtClass: public Ui_autom8_server_qtClass {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_AUTOM8_SERVER_QT_H
