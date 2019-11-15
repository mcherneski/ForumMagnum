import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useTimezone } from '../../components/common/withTimezone';
import moment from 'moment-timezone';

/// A date, formatted for an email. Unlike FormatDate (which is used on regular
/// pages), this doesn't have a tooltip (because that won't work in emails),
/// and also, it never uses relative dates (because they would be relative to
/// when the email was sent, which may be far from when the email is read.)
const EmailFormatDate = ({date, format}) => {
  const { timezone } = useTimezone();
  if (format)
    return <span>{moment(new Date(date)).format(format)}</span>
  else
    return <span>{moment(new Date(date)).format("LLL z")}</span>
}

registerComponent('EmailFormatDate', EmailFormatDate);
