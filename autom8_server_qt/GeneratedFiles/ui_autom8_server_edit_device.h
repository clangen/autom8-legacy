/********************************************************************************
** Form generated from reading UI file 'autom8_server_edit_device.ui'
**
** Created: Sun Mar 11 15:07:16 2012
**      by: Qt User Interface Compiler version 4.7.3
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_AUTOM8_SERVER_EDIT_DEVICE_H
#define UI_AUTOM8_SERVER_EDIT_DEVICE_H

#include <QtCore/QVariant>
#include <QtGui/QAction>
#include <QtGui/QApplication>
#include <QtGui/QButtonGroup>
#include <QtGui/QComboBox>
#include <QtGui/QDialog>
#include <QtGui/QFormLayout>
#include <QtGui/QHBoxLayout>
#include <QtGui/QHeaderView>
#include <QtGui/QLabel>
#include <QtGui/QLineEdit>
#include <QtGui/QPushButton>
#include <QtGui/QSpacerItem>
#include <QtGui/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_autom8_server_edit_device
{
public:
    QVBoxLayout *verticalLayout;
    QFormLayout *formLayout;
    QLabel *label;
    QLabel *label_2;
    QComboBox *TypeComboBox;
    QLabel *label_3;
    QLineEdit *NameLineEdit;
    QLineEdit *AddressLineEdit;
    QSpacerItem *verticalSpacer;
    QHBoxLayout *hboxLayout;
    QSpacerItem *spacerItem;
    QPushButton *OkButton;
    QPushButton *CancelButton;

    void setupUi(QDialog *autom8_server_edit_device)
    {
        if (autom8_server_edit_device->objectName().isEmpty())
            autom8_server_edit_device->setObjectName(QString::fromUtf8("autom8_server_edit_device"));
        autom8_server_edit_device->resize(316, 137);
        verticalLayout = new QVBoxLayout(autom8_server_edit_device);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        formLayout = new QFormLayout();
        formLayout->setObjectName(QString::fromUtf8("formLayout"));
        formLayout->setFieldGrowthPolicy(QFormLayout::AllNonFixedFieldsGrow);
        formLayout->setRowWrapPolicy(QFormLayout::DontWrapRows);
        formLayout->setLabelAlignment(Qt::AlignRight|Qt::AlignTrailing|Qt::AlignVCenter);
        label = new QLabel(autom8_server_edit_device);
        label->setObjectName(QString::fromUtf8("label"));

        formLayout->setWidget(0, QFormLayout::LabelRole, label);

        label_2 = new QLabel(autom8_server_edit_device);
        label_2->setObjectName(QString::fromUtf8("label_2"));

        formLayout->setWidget(1, QFormLayout::LabelRole, label_2);

        TypeComboBox = new QComboBox(autom8_server_edit_device);
        TypeComboBox->setObjectName(QString::fromUtf8("TypeComboBox"));

        formLayout->setWidget(1, QFormLayout::FieldRole, TypeComboBox);

        label_3 = new QLabel(autom8_server_edit_device);
        label_3->setObjectName(QString::fromUtf8("label_3"));

        formLayout->setWidget(2, QFormLayout::LabelRole, label_3);

        NameLineEdit = new QLineEdit(autom8_server_edit_device);
        NameLineEdit->setObjectName(QString::fromUtf8("NameLineEdit"));

        formLayout->setWidget(0, QFormLayout::FieldRole, NameLineEdit);

        AddressLineEdit = new QLineEdit(autom8_server_edit_device);
        AddressLineEdit->setObjectName(QString::fromUtf8("AddressLineEdit"));

        formLayout->setWidget(2, QFormLayout::FieldRole, AddressLineEdit);


        verticalLayout->addLayout(formLayout);

        verticalSpacer = new QSpacerItem(20, 40, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout->addItem(verticalSpacer);

        hboxLayout = new QHBoxLayout();
#ifndef Q_OS_MAC
        hboxLayout->setSpacing(6);
#endif
        hboxLayout->setContentsMargins(0, 0, 0, 0);
        hboxLayout->setObjectName(QString::fromUtf8("hboxLayout"));
        spacerItem = new QSpacerItem(131, 31, QSizePolicy::Expanding, QSizePolicy::Minimum);

        hboxLayout->addItem(spacerItem);

        OkButton = new QPushButton(autom8_server_edit_device);
        OkButton->setObjectName(QString::fromUtf8("OkButton"));

        hboxLayout->addWidget(OkButton);

        CancelButton = new QPushButton(autom8_server_edit_device);
        CancelButton->setObjectName(QString::fromUtf8("CancelButton"));

        hboxLayout->addWidget(CancelButton);


        verticalLayout->addLayout(hboxLayout);

        QWidget::setTabOrder(NameLineEdit, TypeComboBox);
        QWidget::setTabOrder(TypeComboBox, AddressLineEdit);
        QWidget::setTabOrder(AddressLineEdit, OkButton);
        QWidget::setTabOrder(OkButton, CancelButton);

        retranslateUi(autom8_server_edit_device);
        QObject::connect(CancelButton, SIGNAL(clicked()), autom8_server_edit_device, SLOT(reject()));

        QMetaObject::connectSlotsByName(autom8_server_edit_device);
    } // setupUi

    void retranslateUi(QDialog *autom8_server_edit_device)
    {
        autom8_server_edit_device->setWindowTitle(QApplication::translate("autom8_server_edit_device", "autom8 - Edit Device", 0, QApplication::UnicodeUTF8));
        label->setText(QApplication::translate("autom8_server_edit_device", "Name:", 0, QApplication::UnicodeUTF8));
        label_2->setText(QApplication::translate("autom8_server_edit_device", "Type:", 0, QApplication::UnicodeUTF8));
        TypeComboBox->clear();
        TypeComboBox->insertItems(0, QStringList()
         << QApplication::translate("autom8_server_edit_device", "Lamp", 0, QApplication::UnicodeUTF8)
         << QApplication::translate("autom8_server_edit_device", "Appliance", 0, QApplication::UnicodeUTF8)
         << QApplication::translate("autom8_server_edit_device", "Security Sensor", 0, QApplication::UnicodeUTF8)
        );
        label_3->setText(QApplication::translate("autom8_server_edit_device", "Address:", 0, QApplication::UnicodeUTF8));
        OkButton->setText(QApplication::translate("autom8_server_edit_device", "OK", 0, QApplication::UnicodeUTF8));
        CancelButton->setText(QApplication::translate("autom8_server_edit_device", "Cancel", 0, QApplication::UnicodeUTF8));
    } // retranslateUi

};

namespace Ui {
    class autom8_server_edit_device: public Ui_autom8_server_edit_device {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_AUTOM8_SERVER_EDIT_DEVICE_H
