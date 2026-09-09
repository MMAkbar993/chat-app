-- File messages only ever stored their randomised on-disk path (msg-<uuid>-<epoch>.pdf), and the
-- UI derived the label from that, so recipients saw a meaningless string instead of the name the
-- sender actually attached. Keep the original name alongside the URL.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
