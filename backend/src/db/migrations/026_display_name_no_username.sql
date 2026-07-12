-- "Display as username" is being removed as an option (Full Name / First Name only),
-- since showing the handle instead of the KYC'd name undermines trust signals.
-- Reset anyone currently opted into it back to the default (NULL -> falls back to full_name).
UPDATE users SET display_name = NULL WHERE display_name = username;
