import React from 'react';
import { useApp } from '../../context/AppContext';
import { PersianDatePicker } from './PersianDatePicker';
import { GregorianDatePicker } from './GregorianDatePicker';
import { tPortal } from '../../i18n/portalUi';

type OrgDatePickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
};

export const OrgDatePicker: React.FC<OrgDatePickerProps> = (props) => {
  const { orgLocale } = useApp();

  if (orgLocale.calendar === 'gregorian') {
    return <GregorianDatePicker {...props} prefs={orgLocale} />;
  }

  return (
    <PersianDatePicker
      {...props}
      placeholder={
        props.placeholder ??
        (orgLocale.language === 'en'
          ? tPortal('en', 'jalaliCalendar')
          : 'انتخاب تاریخ شمسی')
      }
    />
  );
};
