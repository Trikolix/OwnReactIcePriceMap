<?php
/**
 * PHPMailer - A full-featured email creation and transfer class for PHP.
 *
 * @author    Marcus Bointon (Synchro/coolbru) <phpmailer@synchrotech.co.uk>
 * @author    Jim Jagielski (jimjag) <jimjag@gmail.com>
 * @author    Andy Prevost (codeworxtech) <codeworxtech@users.sourceforge.net>
 * @author    Brent R. Matzelle (original creator)
 * @copyright 2004-2022, Brent R. Matzelle
 * @copyright 2010-2022, Jim Jagielski
 * @copyright 2014-2022, Marcus Bointon
 * @license   http://www.gnu.org/copyleft/lesser.html GNU Lesser General Public License
 * @link      https://github.com/PHPMailer/PHPMailer
 * @see       https://github.com/PHPMailer/PHPMailer/tree/master/test/ PHPMailer test suite
 */

// This file is part of the PHPMailer package.
// You can download it on the amazing GitHub: https://github.com/PHPMailer/PHPMailer

namespace PHPMailer\PHPMailer;

/*
 * Ensure this file is not loaded if it has already been loaded
 * except in the case of testing where it needs to be torn down
 * and re-setup between tests.
 *
 * If you are using this file in your project, and you are NOT using
 * Composer, you MUST include the files `PHPMailer.php`, `SMTP.php`,
 * and `Exception.php` like so:
 *
 * ```php
 * use PHPMailer\PHPMailer\PHPMailer;
 * use PHPMailer\PHPMailer\SMTP;
 * use PHPMailer\PHPMailer\Exception;
 *
 * require 'path/to/PHPMailer/src/Exception.php';
 * require 'path/to/PHPMailer/src/PHPMailer.php';
 * require 'path/to/PHPMailer/src/SMTP.php';
 * ```
 *
 * If you are using Composer, you should be using the Composer autoloader exclusively.
 *
 * ```php
 * require 'vendor/autoload.php';
 *
 * $mail = new PHPMailer(true);
 * ```
 */
if (
    !defined('PHPMailer\Test\PHPMailerTest') &&
    (
        class_exists('PHPMailer\PHPMailer\PHPMailer', false) ||
        class_exists('PHPMailer', false)
    )
) {
    return;
}

/**
 * An exception class for PHPMailer.
 *
 * @see       https://github.com/PHPMailer/PHPMailer
 */
class Exception extends \Exception
{
    /**
     * Prettify error message output.
     *
     * @return string
     */
    public function errorMessage()
    {
        return '<strong>' . htmlspecialchars($this->getMessage(), ENT_COMPAT) . "</strong><br />\n";
    }
}

/**
 * PHPMailer is a full-featured email creation and transfer class for PHP.
 *
 * It extends the Exception class, allowing it to act as a root-level exception for all
 * other exception classes in the PHPMailer namespace.
 */
class PHPMailer extends Exception
{
    /**
     * Email priority.
     * Options: null (default), 1 (highest), 3 (normal), 5 (lowest).
     *
     * @var int
     */
    public $Priority;

    /**
     * The character set of the message.
     *
     * @var string
     */
    public $CharSet = self::CHARSET_ISO88591;

    /**
     * The character set of the message in case of an error.
     *
     * @var string
     */
    public $error_char_set = self::CHARSET_UTF8;

    /**
     * The MIME Content-type of the message.
     *
     * @var string
     */
    public $ContentType = self::CONTENT_TYPE_TEXT_PLAIN;

    /**
     * The message encoding.
     * Options: "8bit", "7bit", "binary", "base64", and "quoted-printable".
     *
     * @var string
     */
    public $Encoding = self::ENCODING_8BIT;

    /**
     * Holds the most recent mailer error message.
     *
     * @var string
     */
    public $ErrorInfo = '';

    /**
     * The From email address for the message.
     *
     * @var string
     */
    public $From = 'root@localhost';

    /**
     * The From name of the message.
     *
     * @var string
     */
    public $FromName = 'Root User';

    /**
     * The Sender email address for the message.
     * If not empty, will be sent via -f to sendmail or as the 'MAIL FROM' value over SMTP.
     *
     * @var string
     */
    public $Sender = '';

    /**
     * The Subject of the message.
     *
     * @var string
     */
    public $Subject = '';

    /**
     * An HTML or plain text message body.
     * If HTML,ম</body>should be included.
     *
     * @var string
     */
    public $Body = '';

    /**
     * The plain-text message body.
     * This body can be read by mail clients that do not have HTML email capability
     * such as mutt & Eudora.
     * Clients that can read HTML will view the normal Body.
     *
     * @var string
     */
    public $AltBody = '';

    /**
     * An iCal message part body.
     * Only supported in simple alt or alt_inline message types
     * To generate iCal event structures, use classes like EasyPeasyICS or iCalcreator.
     *
     * @see https://github.com/sprain/EasyPeasyICS
     * @see http://kigkonsult.se/iCalcreator/
     *
     * @var string
     */
    public $Ical = '';

    /**
     * The Action to take for RFC 822 field "Action".
     *
     * @var string
     */
    public $action = '';

    /**
     * The Location for RFC 822 field "Location".
     *
     * @var string
     */
    public $location = '';

    /**
     * The Body of the RFC 822 field "Comment".
     *
     * @var string
     */
    public $comment = '';

    /**
     * The complete compiled MIME message body.
     * This is a readonly property.
     *
     * @var string
     *
     * @see createBody()
     */
    protected $MIMEBody = '';

    /**
     * The complete compiled MIME message headers.
     * This is a readonly property.
     *
     * @var string
     *
     * @see createHeader()
     */
    protected $MIMEHeader = '';

    /**
     * Extra headers used in mail().
     * This is a readonly property.
     *
     * @var string
     *
     * @see mailSend()
     */
    protected $mailHeader = '';

    /**
     * Word-wrap the message body to this number of chars.
     * Can be set to 0 to not wrap.
     * A value of 0 means that the line length is unlimited.
     *
     * @var int
     */
    public $WordWrap = 0;

    /**
     * Which method to use to send mail.
     * Options: "mail", "sendmail", or "smtp".
     *
     * @var string
     */
    public $Mailer = self::MAILER_MAIL;

    /**
     * The path to the sendmail program.
     *
     * @var string
     */
    public $Sendmail = '/usr/sbin/sendmail';

    /**
     * Whether to use POP-before-SMTP authentication.
     *
     * @var bool
     */
    public $UseSendmailOptions = true;

    /**
     * The email address that a reading confirmation should be sent to, also known as read receipt.
     *
     * @var string
     */
    public $ConfirmReadingTo = '';

    /**
     * The hostname to use in the Message-ID header and as default HELO string.
     * If empty, PHPMailer attempts to find one with, in order,
     * `$_SERVER['SERVER_NAME']`, `$_SERVER['SERVER_ADDR']`, `gethostname()`.
     *
     * @var string
     */
    public $Hostname = '';

    /**
     * An ID to be used in the Message-ID header.
     * If empty, a unique id will be generated.
     * You can set your own, but it must be in the format `<id@domain>`,
     * as defined in RFC 5322 section 3.6.4, or it will be ignored.
     *
     * @see https://tools.ietf.org/html/rfc5322#section-3.6.4
     *
     * @var string
     */
    public $MessageID = '';

    /**
     * The date to be used in the Date header.
     * If empty, the current date will be used.
     * It must be a unix timestamp, or a string that `strtotime()` can recognise.
     *
     * @var string|int
     */
    public $MessageDate = '';

    /**
     * SMTP hosts.
     * Either a single hostname or multiple semicolon-delimited hostnames.
     * You can also specify a different port
     * for each host by using this format: [hostname:port].
     * You can also specify connections using SSL or TLS protocol
     * by using the `ssl://` or `tls://` prefix.
     * For example: `ssl://smtp.example.com:465`.
     * Hosts will be tried in order.
     *
     * @var string
     */
    public $Host = 'localhost';

    /**
     * The default SMTP server port.
     *
     * @var int
     */
    public $Port = 25;

    /**
     * The SMTP HELO of the message.
     * Default is `$Hostname`. If `$Hostname` is empty, PHPMailer attempts to find
     * one with the same method described above for `$Hostname`.
     *
     * @var string
     *
     * @see PHPMailer::$Hostname
     */
    public $Helo = '';

    /**
     * The secure connection prefix.
     * Options: '', 'ssl' or 'tls'.
     *
     * @var string
     */
    public $SMTPSecure = '';

    /**
     * Whether to use SMTP authentication.
     * Uses the Username and Password properties.
     *
     * @var bool
     *
     * @see PHPMailer::$Username
     * @see PHPMailer::$Password
     */
    public $SMTPAuth = false;

    /**
     * Options array for username/password authentication.
     * In the case of an `XOAUTH2` authentication type, the array key
     * for the username is `userName`, and the key for the password
     * is `provider`.
     *
     * @var array
     */
    public $AuthType = '';

    /**
     * The oAuth2 settings.
     *
     * @var \League\OAuth2\Client\Provider\AbstractProvider
     */
    protected $oauth;

    /**
     * SMTP username.
     *
     * @var string
     */
    public $Username = '';

    /**
     * SMTP password.
     *
     * @var string
     */
    public $Password = '';

    /**
     * SMTP Account name, for NTLM authentication.
     *
     * @var string
     */
    public $AuthNTLM = [
        'workstation' => '',
        'domain' => '',
    ];

    /**
     * The SMTP server timeout in seconds.
     * Default of 5 minutes (300s) is from RFC2821 section 4.5.3.2.
     * This needs to be longer than the server's own timeout.
     *
     * @var int
     */
    public $Timeout = 300;

    /**
     * The SMTP connection timeout in seconds.
     *
     * @var int
     */
    public $Connect_timeout = 10;

    /**
     * SMTP class debug output mode.
     *
     * @see SMTP::$do_debug
     *
     * @var int
     */
    public $SMTPDebug = 0;

    /**
     * How to handle debug output.
     * Options:
     * * `echo` Output plain-text as-is, appropriate for CLI
     * * `html` Output escaped, line-breaked HTML, appropriate for browser output
     * * `error_log` Output to error log as configured in php.ini
     * By default, will mimic the behaviour of `error_reporting()`
     *
     * Alternatively, you can provide a callable expecting two params: a string and the debug level:
     *
     * ```php
     * $mail->Debugoutput = function($str, $level) {echo "debug level $level; message: $str";};
     * ```
     *
     * Alternatively, you can pass in an instance of a PSR-3 compatible logger, though only `addDebug()`
     * and `addError()` are used.
     *
     * @see https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-3-logger-interface.md
     *
     * @var string|callable|\Psr\Log\LoggerInterface
     */
    public $Debugoutput = 'echo';

    /**
     * Whether to keep the SMTP connection open after each message.
     * If this is set to true then calling `send()` many times with the same connection
     * will reuse the connection on success.
     *
     * @var bool
     */
    public $SMTPKeepAlive = false;

    /**
     * Whether to use VERP.
     *
     * @see https://en.wikipedia.org/wiki/Variable_envelope_return_path
     * @see http://www.postfix.org/VERP_README.html Postfix VERP info
     *
     * @var bool
     */
    public $do_verp = false;

    /**
     * Whether to allow insecure connections.
     * Set this true to allow connections to SMTP servers that have invalid
     * or self-signed SSL certificates.
     * `SMTPOptions` is required for this to work.
     *
     * @var bool
     */
    public $AllowEmpty = false;

    /**
     * The default line ending.
     *
     * @var string
     */
    public static $LE = "\n";

    /**
     * DKIM signing domain name.
     *
     * @var string
     */
    public $DKIM_domain = '';

    /**
     * DKIM Identity.
     * Usually the email address used as the source of the email.
     *
     * @var string
     */
    public $DKIM_identity = '';

    /**
     * DKIM "passphrase".
     * Used with DKIM_private.
     *
     * @var string
     */
    public $DKIM_passphrase = '';

    /**
     * DKIM private key file path.
     *
     * @var string
     */
    public $DKIM_private = '';

    /**
     * DKIM private key string.
     * If set, takes precedence over `DKIM_private`.
     *
     * @var string
     */
    public $DKIM_private_string = '';

    /**
     * DKIM selector.
     *
     * @var string
     */
    public $DKIM_selector = '';

    /**
     * Overwrite the default DKIM signing headers.
     *
     * @var array
     */
    public $DKIM_extraheaders = [];

    /**
     * Add headers to be excluded from DKIM signing.
     *
     * @var array
     */
    public $DKIM_skip_headers = ['Received', 'Return-Path', 'X-Spam-Checker-Version',
        'X-Spam-Level', 'X-Spam-Status'];

    /**
     * Callback Action function name.
     *
     * The function that handles the result of the send email action.
     * It is called out by `send()` for each email sent.
     *
     * Value can be any php callable: http://www.php.net/is_callable
     *
     * Parameters:
     *   bool $result        result of the send action
     *   array   $to            email addresses of the recipients
     *   array   $cc            cc email addresses
     *   array   $bcc           bcc email addresses
     *   string  $subject       the subject
     *   string  $body          the email body
     *   string  $from          email address of sender
     *   string  $extra         extra information of possible use
     *
     * @var callable
     */
    public $action_function = '';

    /**
     * What to use in the X-Mailer header.
     * Options: null for default, whitespace for none, or a string to use.
     *
     * @var string|null
     */
    public $XMailer = '';

    /**
     * The PHPMailer version number.
     *
     * @var string
     */
    public const VERSION = '6.9.1';

    /**
     * This is the SMTP mail server Maver.
     *
     * @var string
     */
    public const MAILER_MAIL = 'mail';

    /**
     * This is the SMTP mail server Maver.
     *
     * @var string
     */
    public const MAILER_SENDMAIL = 'sendmail';

    /**
     * This is the SMTP mail server Maver.
     *
     * @var string
     */
    public const MAILER_SMTP = 'smtp';

    /**
     * The character set to use.
     *
     * @var string
     */
    public const CHARSET_ASCII = 'us-ascii';

    /**
     * The character set to use.
     *
     * @var string
     */
    public const CHARSET_ISO88591 = 'iso-8859-1';

    /**
     * The character set to use.
     *
     * @var string
     */
    public const CHARSET_UTF8 = 'utf-8';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_PLAINTEXT = 'text/plain';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_TEXT_CALENDAR = 'text/calendar';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_TEXT_HTML = 'text/html';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_MULTIPART_ALTERNATIVE = 'multipart/alternative';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_MULTIPART_MIXED = 'multipart/mixed';

    /**
     * The content type to use.
     *
     * @var string
     */
    public const CONTENT_TYPE_MULTIPART_RELATED = 'multipart/related';

    /**
     * The encoding to use.
     *
     * @var string
     */
    public const ENCODING_7BIT = '7bit';

    /**
     * The encoding to use.
     *
     * @var string
     */
    public const ENCODING_8BIT = '8bit';

    /**
     * The encoding to use.
     *
     * @var string
     */
    public const ENCODING_BASE64 = 'base64';

    /**
     * The encoding to use.
     *
     * @var string
     */
    public const ENCODING_BINARY = 'binary';

    /**
     * The encoding to use.
     *
     * @var string
     */
    public const ENCODING_QUOTED_PRINTABLE = 'quoted-printable';

    /**
     * The encryption type to use.
     *
     * @var string
     */
    public const ENCRYPTION_STARTTLS = 'tls';

    /**
     * The encryption type to use.
     *
     * @var string
     */
    public const ENCRYPTION_SMTPS = 'ssl';

    /**
     * The debug level to use.
     *
     * @var int
     */
    public const DEBUG_OFF = 0;

    /**
     * The debug level to use.
     *
     * @var int
     */
    public const DEBUG_CLIENT = 1;

    /**
     * The debug level to use.
     *
     * @var int
     */
    public const DEBUG_SERVER = 2;

    /**
     * The debug level to use.
     *
     * @var int
     */
    public const DEBUG_CONNECTION = 3;

    /**
     * The debug level to use.
     *
     * @var int
     */
    public const DEBUG_LOWLEVEL = 4;

    /**
     * The stream context options for the connection.
     *
     * @var array
     */
    public $SMTPOptions = [];

    /**
     * The RFC 822 `from` address.
     *
     * @var string
     */
    protected static $validator = 'php';

    /**
     * The SMTP connection instance.
     *
     * @var SMTP
     */
    protected $smtp;

    /**
     * The list of addresses to send to.
     *
     * @var array
     */
    protected $to = [];

    /**
     * The list of cc addresses to send to.
     *
     * @var array
     */
    protected $cc = [];

    /**
     * The list of bcc addresses to send to.
     *
     * @var array
     */
    protected $bcc = [];

    /**
     * The list of reply-to addresses.
     *
     * @var array
     */
    protected $ReplyTo = [];

    /**
     * The list of all recipient addresses.
     *
     * @var array
     */
    protected $all_recipients = [];

    /**
     * The list of attachments.
     *
     * @var array
     */
    protected $attachment = [];

    /**
     * The list of custom headers.
     *
     * @var array
     */
    protected $CustomHeader = [];

    /**
     * The message boundary.
     *
     * @var string
     */
    protected $message_type = '';

    /**
     * The array of boundary strings.
     *
     * @var array
     */
    protected $boundary = [];

    /**
     * The array of embedded image data.
     *
     * @var array
     */
    protected $embedded_images = [];

    /**
     * The array of custom/undefined RFC 822 headers.
     *
     * @var array
     */
    protected $RFC822Header = [];

    /**
     * The plugin directory for loading external functions.
     *
     * @var string
     */
    public $PluginDir = '';

    /**
     * The array of errors.
     *
     * @var array
     */
    protected $language = [];

    /**
     * The number of errors that have occurred.
     *
     * @var int
     */
    protected $error_count = 0;

    /**
     * The S/MIME certificate file path.
     *
     * @var string
     */
    public $sign_cert_file = '';

    /**
     * The S/MIME key file path.
     *
     * @var string
     */
    public $sign_key_file = '';

    /**
     * The S/MIME key password.
     *
     * @var string
     */
    public $sign_key_pass = '';

    /**
     * Whether to automatically create an alternative body from the HTML body.
     *
     * @var bool
     */
    public $mail_smtp_options = [];

    /**
     * Constructor.
     *
     * @param bool $exceptions Should we throw external exceptions?
     */
    public function __construct($exceptions = null)
    {
        if (null !== $exceptions) {
            $this->exceptions = (bool) $exceptions;
        }
        // Whether to throw exceptions for errors.
        $this->exceptions = (bool) $exceptions;
    }

    /**
     * Destructor.
     */
    public function __destruct()
    {
        //Close any open SMTP connection automatically
        if ($this->Mailer === self::MAILER_SMTP) {
            $this->smtpClose();
        }
    }

    /**
     * Call mail() in a safe_mode-aware fashion.
     * Also, unless sendmail_path is configured in php.ini, some servers
     * are picky about arguments to mail().
     *
     * @param string $to
     * @param string $subject
     * @param string $body
     * @param string $header
     * @param string $params
     *
     * @return bool
     */
    private function mailPassthru($to, $subject, $body, $header, $params)
    {
        //Check for sendmail in safe_mode.
        //It seems that on some servers safe_mode is obsolete but not completely ignored,
        //so we still need to check for it.
        if (
            !ini_get('safe_mode') &&
            !in_array('mail', explode(',', ini_get('disable_functions')), true)
        ) {
            //@codingStandardsIgnoreStart
            if ($this->UseSendmailOptions === false) {
                $rt = @mail($to, $this->encodeHeader($subject), $body, $header);
            } else {
                $rt = @mail($to, $this->encodeHeader($subject), $body, $header, $params);
            }
            //@codingStandardsIgnoreEnd
        } else {
            $rt = $this->sendmailSend($header, $body);
        }

        return $rt;
    }

    /**
     * Set the language for error messages.
     *
     * @param string $langcode
     * @param string $lang_path
     *
     * @return bool
     */
    public function setLanguage($langcode = 'en', $lang_path = '')
    {
        //Define full set of translatable strings in English
        $PHPMAILER_LANG = [
            'authenticate' => 'SMTP Error: Could not authenticate.',
            'connect_host' => 'SMTP Error: Could not connect to SMTP host.',
            'data_not_accepted' => 'SMTP Error: data not accepted.',
            'empty_message' => 'Message body empty',
            'encoding' => 'Unknown encoding: ',
            'execute' => 'Could not execute: ',
            'file_access' => 'Could not access file: ',
            'file_open' => 'File Error: Could not open file: ',
            'from_failed' => 'The following From address failed: ',
            'instantiate' => 'Could not instantiate mail function.',
            'invalid_address' => 'Invalid address: ',
            'invalid_header' => 'Invalid header: ',
            'invalid_host' => 'Invalid host: ',
            'mailer_not_supported' => ' mailer is not supported.',
            'provide_address' => 'You must provide at least one recipient email address.',
            'recipients_failed' => 'SMTP Error: The following recipients failed: ',
            'signing' => 'Signing Error: ',
            'smtp_connect_failed' => 'SMTP connect() failed.',
            'smtp_error' => 'SMTP server error: ',
            'variable_set' => 'Cannot set or reset variable: ',
            'extension_missing' => 'Extension missing: ',
        ];
        if (empty($lang_path)) {
            //Fall back to the standard path for the sendmail command.
            $lang_path = dirname(__DIR__) . '/language/';
        }
        //A lot of people seem to have trouble with this, so give a verbose error if it fails.
        if (!is_readable($lang_path . 'phpmailer.lang-' . $langcode . '.php')) {
            //Try English as a last resort, maybe the language file is missing.
            if (!is_readable($lang_path . 'phpmailer.lang-en.php')) {
                //If that fails, use the hardcoded English strings above.
                $this->language = $PHPMAILER_LANG;

                return false;
            }
            $langcode = 'en';
        }
        //Include the language file
        $this->language = include $lang_path . 'phpmailer.lang-' . $langcode . '.php';
        //Merge the loaded language file with the English strings,
        //so we have a full set of translations for all strings.
        $this->language = array_merge($PHPMAILER_LANG, $this->language);

        return true;
    }

    /**
     * Get the array of strings for the current language.
     *
     * @return array
     */
    public function getTranslations()
    {
        return $this->language;
    }

    /**
     * Create a message and assign to mails.
     *
     * @return bool
     */
    public function isHTML($isHtml = true)
    {
        if ($isHtml) {
            $this->ContentType = static::CONTENT_TYPE_TEXT_HTML;
        } else {
            $this->ContentType = static::CONTENT_TYPE_TEXT_PLAIN;
        }
    }

    /**
     * Create a message and assign to mails.
     *
     * @return bool
     */
    public function isSMTP()
    {
        $this->Mailer = static::MAILER_SMTP;
    }

    /**
     * Create a message and assign to mails.
     *
     * @return bool
     */
    public function isMail()
    {
        $this->Mailer = static::MAILER_MAIL;
    }

    /**
     * Create a message and assign to mails.
     *
     * @return bool
     */
    public function isSendmail()
    {
        $ini_sendmail_path = ini_get('sendmail_path');

        if (stripos($ini_sendmail_path, 'sendmail') !== false) {
            $this->Sendmail = $ini_sendmail_path;
            $this->Mailer = static::MAILER_SENDMAIL;
        } else {
            $this->Mailer = static::MAILER_MAIL;
        }
    }

    /**
     * Create a message and assign to mails.
     *
     * @return bool
     */
    public function isQmail()
    {
        $ini_sendmail_path = ini_get('sendmail_path');

        if (stripos($ini_sendmail_path, 'qmail') !== false) {
            $this->Sendmail = $ini_sendmail_path;
            $this->Mailer = static::MAILER_SENDMAIL;
        } else {
            $this->Mailer = static::MAILER_MAIL;
        }
    }

    /**
     * Add a "To" address.
     *
     * @param string $address The email address to send to
     * @param string $name
     *
     * @return bool
     */
    public function addAddress($address, $name = '')
    {
        return $this->addAnAddress('to', $address, $name);
    }

    /**
     * Add a "CC" address.
     *
     * @param string $address The email address to send to
     * @param string $name
     *
     * @return bool
     */
    public function addCC($address, $name = '')
    {
        return $this->addAnAddress('cc', $address, $name);
    }

    /**
     * Add a "BCC" address.
     *
     * @param string $address The email address to send to
     * @param string $name
     *
     * @return bool
     */
    public function addBCC($address, $name = '')
    {
        return $this->addAnAddress('bcc', $address, $name);
    }

    /**
     * Add a "Reply-to" address.
     *
     * @param string $address The email address to reply to
     * @param string $name
     *
     * @return bool
     */
    public function addReplyTo($address, $name = '')
    {
        return $this->addAnAddress('Reply-To', $address, $name);
    }

    /**
     * Get the addresses to send to.
     *
     * @return array
     */
    public function getToAddresses()
    {
        return $this->to;
    }

    /**
     * Get the CC addresses.
     *
     * @return array
     */
    public function getCcAddresses()
    {
        return $this->cc;
    }

    /**
     * Get the BCC addresses.
     *
     * @return array
     */
    public function getBccAddresses()
    {
        return $this->bcc;
    }

    /**
     * Get the Reply-to addresses.
     *
     * @return array
     */
    public function getReplyToAddresses()
    {
        return $this->ReplyTo;
    }

    /**
     * Add an address to one of the recipient arrays.
     * Addresses that have been added already return true, but are not added again.
     *
     * @param string $kind    One of 'to', 'cc', 'bcc', 'Reply-To'
     * @param string $address The email address to send to
     * @param string $name
     *
     * @throws Exception
     *
     * @return bool
     */
    protected function addAnAddress($kind, $address, $name = '')
    {
        if (!in_array($kind, ['to', 'cc', 'bcc', 'Reply-To'], true)) {
            $error_message = sprintf(
                '%s: %s',
                $this->lang('invalid_address'),
                $kind
            );
            $this->setError($error_message);
            if ($this->exceptions) {
                throw new Exception($error_message);
            }
            echo $error_message . self::$LE;

            return false;
        }
        if (!static::validateAddress($address)) {
            $error_message = sprintf(
                '%s (%s): %s',
                $this->lang('invalid_address'),
                $kind,
                $address
            );
            $this->setError($error_message);
            if ($this->exceptions) {
                throw new Exception($error_message);
            }
            echo $error_message . self::$LE;

            return false;
        }
        if ($kind !== 'Reply-To') {
            if (!array_key_exists(strtolower($address), $this->all_recipients)) {
                $this->{$kind}[] = [$address, $name];
                $this->all_recipients[strtolower($address)] = true;

                return true;
            }
        } else {
            if (!array_key_exists(strtolower($address), $this->ReplyTo)) {
                $this->ReplyTo[strtolower($address)] = [$address, $name];

                return true;
            }
        }

        return false;
    }

    /**
     * Set the From and FromName properties.
     *
     * @param string $address
     * @param string $name
     * @param bool   $auto    Whether to also set the Sender address, defaults to true
     *
     * @throws Exception
     *
     * @return bool
     */
    public function setFrom($address, $name = '', $auto = true)
    {
        $address = trim($address);
        $name = trim(preg_replace('/[\r\n]+/', '', $name)); //Strip breaks and trim
        if (!static::validateAddress($address)) {
            $error_message = $this->lang('invalid_address') . ' (From): ' . $address;
            $this->setError($error_message);
            if ($this->exceptions) {
                throw new Exception($error_message);
            }
            echo $error_message . self::$LE;

            return false;
        }
        $this->From = $address;
        $this->FromName = $name;
        if ($auto) {
            if (empty($this->Sender)) {
                $this->Sender = $address;
            }
        }

        return true;
    }

    /**
     * Return the Message-ID header for the current message.
     * If not yet generated, it will be generated.
     *
     * @return string
     */
    public function getLastMessageID()
    {
        return $this->MessageID;
    }

    /**
     * Check that a string looks like an email address.
     *
     * @param string $address The email address to check
     * @param string|callable $patternselect A selector for the validation pattern to use :
     *   'auto' let PHPMailer choose the best validator
     *   'pcre' use the squiloople.com pattern, requires PCRE
     *   'pcre8' use the squiloople.com pattern, requires PCRE but works with UTF-8
     *   'html5' use the simple RFC 5322 pattern used in HTML5 forms
     *   'php' use PHP's internal `filter_var()` function
     *   'practical' use a simplified version of RFC 5322 that is less strict
     *   'noregex' don't use a regex, just look for an `@`
     *   A callable which returns `true` if the address is valid, `false` otherwise
     *
     * @return bool
     */
    public static function validateAddress($address, $patternselect = null)
    {
        if (null === $patternselect) {
            $patternselect = static::$validator;
        }
        if (is_callable($patternselect)) {
            return $patternselect($address);
        }
        //This is going to be slow, so try to avoid it if we can
        if (
            strpos($address, "\n") !== false ||
            strpos($address, "\r") !== false
        ) {
            return false;
        }

        switch ($patternselect) {
            case 'pcre': //Kept for BC
            case 'pcre8':
                /*
                 * A more complex and more permissive regex than RFC 5322
                 * This allows for things like 'Sïlé O'Corrúbhan <sile@nospam.com>'
                 * suggested by Mike Brady <mikebrady@sile.com>
                 * It will also allow local part starting with numbers or invalid characters
                 * It also doesn't check for sequences of dots, spaces or comments
                 * This is the default.
                 */
                // The regex below is based on a regex by Jan Goyvaerts - jan.goyvaerts@gmail.com
                if (
                    preg_match(
                        '/^(?!(?>(?1)"?(?>\\\\\[ -~]|[^\"])"?(?1)){255,})(?!(?>(?1)"?(?>\\\\\[ -~]|[^\"])"?(?1)){65,}@)' . 
                        '((?>(?>(?>((?>(?>(?>\x0D\x0A)?[\t ])+|(?>[\t ]*\x0D\x0A)?[\t ]+)?)(\((?>(?2)' . 
                        '(?>[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]|[\x21-\x5A\x5E-\x7E]|\\\\[\x00-\x7F]|(?3)))*(?2)\)))+(?2))' . 
                        '|(?2))?)((("?)(?>\x0D\x0A)?[\t ]*)?((?(4)(?1)|(?1)))' . 
                        '((.?(?3)))*?)?)@(((?1)[a-z\d\x80-\xff](?!.{0,62}[a-z\d\x80-\xff-]{63,})' . 
                        '(?>[a-z\d\x80-\xff-]*[a-z\d\x80-\xff])?)(\.(?1)[a-z\d\x80-\xff](?!.{0,62}[a-z\d\x80-\xff-]{63,})' . 
                        '(?>[a-z\d\x80-\xff-]*[a-z\d\x80-\xff])?)*)|(?1)\[(?>([a-z\d\x80-\xff-]{1,63}\.)' . 
                        '*[a-z\d\x80-\xff-]{1,63}|\[(?>([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|' . 
                        '([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|' . 
                        '([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}' . 
                        '(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|' . 
                        '([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:' . 
                        '((:[0-9a-fA-F]{1,4}){1,6})|:(:(:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|' . 
                        '::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}' . 
                        '(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:' . 
                        '((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}' . 
                        '(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\])' . 
                        '|(?1)\[(?>([a-z\d\x80-\xff-]{1,63}\.)*[a-z\d\x80-\xff-]{1,63}|' . 
                        '\[(?>([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|' . 
                        '([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|' . 
                        '([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}' . 
                        '(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|' . 
                        '[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:(:(:[0-9a-fA-F]{1,4}){1,7}|:)|' . 
                        'fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}' . 
                        '((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|' . 
                        '([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}' . 
                        '(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\]))$/isD',
                        $address
                    )
                ) {
                    return true;
                }
                break;
            case 'html5':
                /*
                 * This is the pattern used by the HTML5 spec for validating email addresses.
                 *
                 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-(type=email)
                 */
                if (
                    preg_match(
                        '/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' . 
                        '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/sD',
                        $address
                    )
                ) {
                    return true;
                }
                break;
            case 'noregex':
                //No PCRE, so just do a simple check
                if (strpos($address, '@') < 1) {
                    return false;
                }
                break;
            case 'php':
            default:
                if (filter_var($address, FILTER_VALIDATE_EMAIL) !== false) {
                    return true;
                }
                break;
        }

        return false;
    }

    /**
     * Set the Validator to use for email addresses.
     *
     * @param string $validator
     */
    public static function setvalidator($validator)
    {
        static::$validator = $validator;
    }

    /**
     * Send messages.
     *
     * @return bool
     *
     * @throws Exception
     */
    public function send()
    {
        try {
            if (!$this->preSend()) {
                return false;
            }

            return $this->postSend();
        } catch (Exception $e) {
            $this->mailHeader = '';
            $this->setError($e->getMessage());
            if ($this->exceptions) {
                throw $e;
            }

            return false;
        }
    }

    /**
     * Prepare a message for sending.
     *
     * @throws Exception
     *
     * @return bool
     */
    public function preSend()
    {
        if ('iso-8859-1' !== strtolower($this->CharSet)) {
            $this->error_char_set = strtolower($this->CharSet);
        }
        if (
            (
                empty($this->to) &&
                count($this->cc) < 1 &&
                count($this->bcc) < 1
            )
        ) {
            throw new Exception($this->lang('provide_address'), self::STOP_CRITICAL);
        }

        //Set whether the message is multipart/alternative
        if (!empty($this->AltBody)) {
            $this->ContentType = static::CONTENT_TYPE_MULTIPART_ALTERNATIVE;
        }

        $this->error_count = 0; // reset errors
        $this->message_type = $this->ContentType;
        //If this is a multipart message, create the boundary
        if ($this->message_type === static::CONTENT_TYPE_MULTIPART_ALTERNATIVE) {
            $this->boundary[1] = 'b1_' . hash('sha1', uniqid(time(), true));
            $this->boundary[2] = 'b2_' . hash('sha1', uniqid(time(), true));
        }

        $this->setMessageType();
        //We need to handle MIME type boundaries regardless of mailer method,
        //so do it now rather than in each mailer.
        if (
            !$this->MIMEHeader ||
            !$this->MIMEBody
        ) {
            $this->MIMEHeader = $this->createHeader();
            $this->MIMEBody = $this->createBody();
        }

        // To be created automatically by mail()
        if ($this->Mailer === static::MAILER_MAIL) {
            if (count($this->to) > 0) {
                $this->mailHeader .= $this->addrAppend('To', $this->to);
            } else {
                $this->mailHeader .= $this->headerLine('To', 'undisclosed-recipients:;');
            }
            if (count($this->cc) > 0) {
                $this->mailHeader .= $this->addrAppend('Cc', $this->cc);
            }
        }

        if (
            '' === $this->MessageDate &&
            '' !== $this->MessageID
        ) {
            $this->MessageDate = self::rfcDate();
        }
        //Create an appropriate default message ID if one wasn't provided
        if (empty($this->MessageID)) {
            $this->MessageID = $this->createMessageID();
        }
        $this->MIMEHeader = str_replace(
            '{MESSAGEID}',
            $this->MessageID,
            $this->MIMEHeader
        );

        return true;
    }

    /**
     * Actually send a message previously prepared with preSend().
     *
     * @return bool
     *
     * @throws Exception
     */
    public function postSend()
    {
        try {
            //Choose the mailer and send through it
            switch ($this->Mailer) {
                case static::MAILER_SENDMAIL:
                case 'qmail':
                    return $this->sendmailSend($this->MIMEHeader, $this->MIMEBody);
                case static::MAILER_SMTP:
                    return $this->smtpSend($this->MIMEHeader, $this->MIMEBody);
                case static::MAILER_MAIL:
                    return $this->mailSend($this->MIMEHeader, $this->MIMEBody);
                default:
                    $sendMethod = $this->Mailer . 'Send';
                    if (method_exists($this, $sendMethod)) {
                        return $this->$sendMethod($this->MIMEHeader, $this->MIMEBody);
                    }

                    return $this->mailSend($this->MIMEHeader, $this->MIMEBody);
            }
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            if ($this->exceptions) {
                throw $e;
            }
            echo $e->errorMessage();
        }

        return false;
    }

    /**
     * Send mail using the PHP mail() function.
     *
     * @param string $header The message headers
     * @param string $body   The message body
     *
     * @see    https://www.php.net/manual/en/function.mail.php
     *
     * @throws Exception
     *
     * @return bool
     */
    protected function mailSend($header, $body)
    {
        $toArr = [];
        foreach ($this->to as $to) {
            $toArr[] = $this->addrFormat($to);
        }
        $to = implode(', ', $toArr);

        if (empty($this->Sender)) {
            $params = ' ';
        } else {
            $params = sprintf('-f%s', $this->Sender);
        }
        if ($this->Sender !== '' && !ini_get('safe_mode')) {
            // The fifth parameter to mail() will set the Return-Path header,
            // and typically no other headers.
            // We need to pass the Sender address to sendmail with the -f argument.
            // There is no easy way to do this with mail() alone,
            // so instead we use a custom sendmail command.
            $old_from = ini_get('sendmail_from');
            ini_set('sendmail_from', $this->Sender);
        }
        $result = false;
        if ($this->SingleTo && count($toArr) > 1) {
            foreach ($toArr as $key => $val) {
                $rt = $this->mailPassthru($val, $this->Subject, $body, $header, $params);
                $ids = $this->SingleToArray[$key];
                $this->doCallback(
                    $rt,
                    [$val],
                    $this->cc,
                    $this->bcc,
                    $this->Subject,
                    $body,
                    $this->From,
                    ['to_ids' => $ids]
                );
                $result = $result || $rt;
            }
        } else {
            $rt = $this->mailPassthru($to, $this->Subject, $body, $header, $params);
            $this->doCallback($rt, $this->to, $this->cc, $this->bcc, $this->Subject, $body, $this->From, []);
            $result = $rt;
        }
        if (isset($old_from)) {
            ini_set('sendmail_from', $old_from);
        }
        if (!$result) {
            throw new Exception($this->lang('instantiate'), self::STOP_CRITICAL);
        }

        return true;
    }

    /**
     * Send mail using the sendmail MTA.
     *
     * @param string $header The message headers
     * @param string $body   The message body
     *
     * @return bool
     */
    public function sendmailSend($header, $body)
    {
        //Create sendmail parameters
        if ($this->Sender !== '') {
            $sendmail_params = sprintf('-f%s', $this->Sender);
        } else {
            $sendmail_params = ' ';
        }
        $header = str_replace("\r\n", static::$LE, $header);
        $body = str_replace("\r\n", static::$LE, $body);

        //It seems that on some servers safe_mode is obsolete but not completely ignored,
        //so we still need to check for it.
        if (
            !ini_get('safe_mode') &&
            !in_array('exec', explode(',', ini_get('disable_functions')), true)
        ) {
            //@codingStandardsIgnoreStart
            $sendmail = @popen($this->Sendmail . ' ' . $sendmail_params, 'w');
            //@codingStandardsIgnoreEnd
            if (!$sendmail) {
                throw new Exception($this->lang('execute') . $this->Sendmail, self::STOP_CRITICAL);
            }
            fwrite($sendmail, $header);
            fwrite($sendmail, $body);
            //Wait for the process to terminate so we can get the exit status
            $pclose_result = pclose($sendmail);
            if ($pclose_result !== 0) {
                $this->setError($this->lang('execute') . $this->Sendmail);
                if ($this->exceptions) {
                    throw new Exception($this->lang('execute') . $this->Sendmail, self::STOP_CRITICAL);
                }

                return false;
            }
        } else {
            //@codingStandardsIgnoreStart
            //Use the mail function as a fallback
            $sendmail = @mail(
                $this->addrFormat($this->to[0]),
                $this->encodeHeader($this->Subject),
                $body,
                $header,
                $sendmail_params
            );
            //@codingStandardsIgnoreEnd
            if (!$sendmail) {
                throw new Exception($this->lang('instantiate'), self::STOP_CRITICAL);
            }
        }

        return true;
    }

    /**
     * Send mail via SMTP.
     * Returns false if there is a bad HELO, or if any recipient lost,
     * or if failed to send.
     *
     * @param string $header The message headers
     * @param string $body   The message body
     *
     * @throws Exception
     *
     * @return bool
     */
    protected function smtpSend($header, $body)
    {
        $bad_rcpt = [];
        if (!$this->smtpConnect($this->mail_smtp_options)) {
            throw new Exception($this->lang('smtp_connect_failed'), self::STOP_CRITICAL);
        }
        //Helo is optional, but if it's used, we need to check the reply
        if ('' === $this->Helo) {
            $helo = $this->serverHostname();
        } else {
            $helo = $this->Helo;
        }
        if (!$this->smtp->hello($helo)) {
            $this->setError($this->lang('smtp_error') . $this->smtp->getError()['error']);
            if ($this->exceptions) {
                throw new Exception($this->lang('smtp_error') . $this->smtp->getError()['error'], self::STOP_CRITICAL);
            }

            return false;
        }
        //Try AUTH LOGIN first, then PLAIN if that fails
        if ($this->SMTPAuth) {
            if (!$this->smtp->authenticate(
                $this->Username,
                $this->Password,
                $this->AuthType,
                $this->oauth
            )) {
                throw new Exception($this->lang('authenticate'), self::STOP_CRITICAL);
            }
        }
        //Set the source address
        if (!$this->smtp->mail($this->Sender, ($this->do_verp ? ' XVERP' : '')))
         {
            $this->setError(
                $this->lang('from_failed') . $this->Sender . ' : ' .
                implode(',', $this->smtp->getError())
            );
            if ($this->exceptions) {
                throw new Exception($this->getError(), self::STOP_CRITICAL);
            }

            return false;
        }

        //Add recipients
        foreach ([$this->to, $this->cc, $this->bcc] as $togroup) {
            foreach ($togroup as $to) {
                if (!$this->smtp->recipient($to[0])) {
                    $error = $this->smtp->getError();
                    $bad_rcpt[] = ['to' => $to[0], 'error' => $error['error']];
                }
            }
        }

        //Only send the DATA command if we have viable recipients
        if ((count($this->all_recipients) > count($bad_rcpt)) && !$this->smtp->data($header . $body)) {
            throw new Exception($this->lang('data_not_accepted'), self::STOP_CRITICAL);
        }

        if ($this->SMTPKeepAlive) {
            $this->smtp->reset();
        } else {
            $this->smtp->quit();
            $this->smtp->close();
        }

        //Create error message for any bad addresses
        if (count($bad_rcpt) > 0) {
            $errstr = '';
            foreach ($bad_rcpt as $bad) {
                $errstr .= $bad['to'] . ': ' . $bad['error'];
            }
            throw new Exception(
                $this->lang('recipients_failed') . $errstr,
                self::STOP_CONTINUE
            );
        }

        return true;
    }

    /**
     * Initiate a connection to an SMTP server.
     *
     * @param array $options An array of options compatible with stream_context_create()
     *
     * @return bool
     */
    public function smtpConnect($options = null)
    {
        if (null === $this->smtp) {
            $this->smtp = $this->getSMTPInstance();
        }
        //If no connection asks for one
        if (!$this->smtp->connected()) {
            //If no options are provided, use the default ones
            if (null === $options) {
                $options = $this->SMTPOptions;
            }
            //Setup SMTP connection
            if (
                !$this->smtp->connect(
                    $this->Host,
                    $this->Port,
                    $this->Timeout,
                    $options,
                    $this->Connect_timeout
                )
            ) {
                return false;
            }

            $this->smtp->setDebugLevel($this->SMTPDebug);
            $this->smtp->setDebugOutput($this->Debugoutput);
            $this->smtp->setVerp($this->do_verp);
        }

        return true;
    }

    /**
     * Close the active SMTP connection.
     */
    public function smtpClose()
    {
        if (null !== $this->smtp) {
            if ($this->smtp->connected()) {
                $this->smtp->quit();
                $this->smtp->close();
            }
        }
    }

    /**
     * Get an instance to use for SMTP operations.
     * Override this to load your own SMTP implementation, or to inject a mocked one for testing.
     *
     * @return SMTP
     */
    public function getSMTPInstance()
    {
        if (!is_object($this->smtp)) {
            $this->smtp = new SMTP();
        }

        return $this->smtp;
    }

    /**
     * Set SMTP class options.
     *
     * @param array $options
     */
    public function setSMTPInstance(SMTP $smtp)
    {
        $this->smtp = $smtp;
    }

    /**
     * Set the message type.
     *
     * @return bool
     */
    protected function setMessageType()
    {
        $this->message_type = static::CONTENT_TYPE_MULTIPART_MIXED;
        if ($this->alternativeExists()) {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_ALTERNATIVE;
        }
        if ($this->inlineImageExists()) {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_RELATED;
        }

        //The message types now map to multipart/related, multipart/alternative, multipart/mixed
        //There are some wrinkles to this...
        //The precedence is multipart/related, multipart/alternative, multipart/mixed
        //It's not straightforward to recurse into parts of a multipart related message
        //So, if we have a multipart/related message, we can't have a multipart/alternative
        //So, what we do is this:
        //1. If there's an inline image, it's multipart/related
        //2. If there's no inline image, but there is an alternative body, it's multipart/alternative
        //3. If there's no inline image or alternative body, it's multipart/mixed
        //This is all a bit of a mess, but it's the best we can do for now
        //The problem is that you can have a multipart/related message with a multipart/alternative part
        //but you can't have a multipart/alternative message with a multipart/related part
        //This means that if you have an inline image, you can't have an alternative body
        //There's a workaround to this, which is to create the multipart/alternative message
        //as a string, and then add it as a string attachment
        //This is not ideal, but it's the best we can do for now
        if ($this->alternativeExists() && $this->inlineImageExists()) {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_RELATED;
        }
    }

    /**
     * Format an address for use in a message header.
     *
     * @param array $addr A 2-element array containing an address and a name
     *
     * @return string
     */
    public function addrFormat($addr)
    {
        if (empty($addr[1])) { // No name, just the address
            return $this->secureHeader($addr[0]);
        }

        return $this->encodeHeader($this->secureHeader($addr[1]), 'phrase') . ' <' . $this->secureHeader(
            $addr[0]
        ) . '>';
    }

    /**
     * Create a message header.
     *
     * @return string
     */
    public function createHeader()
    {
        $result = '';
        $result .= $this->headerLine('Date', ('' === $this->MessageDate) ? self::rfcDate() : $this->MessageDate);
        if ($this->SingleTo) {
            //If we're sending to each recipient individually, we need to put the To address in the header
            //and not in the bcc field
            foreach ($this->to as $to) {
                $this->SingleToArray[] = $this->addrFormat($to);
            }
        }
        if (count($this->to) > 0) {
            $result .= $this->addrAppend('To', $this->to);
        } elseif (count($this->cc) === 0) {
            $result .= $this->headerLine('To', 'undisclosed-recipients:;');
        }
        $result .= $this->addrAppend('From', [[trim($this->From), $this->FromName]]);
        // We do not want to send CC addresses if we are sending single mails, as all recipients will receive the CCs
        if (count($this->cc) > 0 && !$this->SingleTo) {
            $result .= $this->addrAppend('Cc', $this->cc);
        }
        //BCCs are never included in headers
        if (
            (
                $this->SingleTo ||
                $this->Mailer === static::MAILER_MAIL
            ) &&
            count($this->bcc) > 0
        ) {
            $result .= $this->addrAppend('Bcc', $this->bcc);
        }
        if (count($this->ReplyTo) > 0) {
            $result .= $this->addrAppend('Reply-To', $this->ReplyTo);
        }
        // mail() sets the subject itself
        if ($this->Mailer !== static::MAILER_MAIL) {
            $result .= $this->headerLine('Subject', $this->encodeHeader(trim($this->Subject)));
        }

        //The Message-ID is injected later by the mailer, but we need to know what it is
        //so we can use it in the DKIM signature.
        //We also need to know it before we start creating the MIME structure.
        $result .= $this->headerLine('Message-ID', '{MESSAGEID}');
        if (!empty($this->XMailer)) {
            $result .= $this->headerLine('X-Mailer', $this->XMailer);
        } else {
            $result .= $this->headerLine('X-Mailer', 'PHPMailer ' . self::VERSION . ' (https://github.com/PHPMailer/PHPMailer)');
        }
        if (null !== $this->Priority) {
            $result .= $this->headerLine('X-Priority', $this->Priority);
        }
        if (!empty($this->ConfirmReadingTo)) {
            $result .= $this->headerLine('Disposition-Notification-To', '<' . trim($this->ConfirmReadingTo) . '>');
        }
        //Add custom headers
        foreach ($this->CustomHeader as $header) {
            $result .= $this->headerLine(
                trim($header[0]),
                $this->encodeHeader(trim($header[1]))
            );
        }
        foreach ($this->RFC822Header as $header) {
            $result .= $this->headerLine(
                trim($header[0]),
                $header[1]
            );
        }
        if (!$this->sign_cert_file) {
            $result .= $this->headerLine('MIME-Version', '1.0');
            $result .= $this->getMailMIME();
        }

        return $result;
    }

    /**
     * Get the message MIME type headers.
     *
     * @return string
     */
    public function getMailMIME()
    {
        $result = '';
        $need_alternative = $this->alternativeExists() && !$this->inlineImageExists();
        $need_related = $this->inlineImageExists();
        $need_mixed = $this->attachmentExists();

        //The message types now map to multipart/related, multipart/alternative, multipart/mixed
        //The precedence is multipart/related, multipart/alternative, multipart/mixed
        //It's not straightforward to recurse into parts of a multipart related message
        //So, if we have a multipart/related message, we can't have a multipart/alternative
        //So, what we do is this:
        //1. If there's an inline image, it's multipart/related
        //2. If there's no inline image, but there is an alternative body, it's multipart/alternative
        //3. If there's no inline image or alternative body, it's multipart/mixed
        //This is all a bit of a mess, but it's the best we can do for now
        //The problem is that you can have a multipart/related message with a multipart/alternative part
        //but you can't have a multipart/alternative message with a multipart/related part
        //This means that if you have an inline image, you can't have an alternative body
        //There's a workaround to this, which is to create the multipart/alternative message
        //as a string, and then add it as a string attachment
        //This is not ideal, but it's the best we can do for now
        if ($need_related) {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_RELATED;
        } elseif ($need_alternative) {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_ALTERNATIVE;
        } else {
            $this->message_type = static::CONTENT_TYPE_MULTIPART_MIXED;
        }

        //If we're sending a multipart message, we need to create the boundary
        if ($this->isMultipart()) {
            $this->boundary[1] = 'b1_' . hash('sha1', uniqid(time(), true));
            $this->boundary[2] = 'b2_' . hash('sha1', uniqid(time(), true));
            $this->boundary[3] = 'b3_' . hash('sha1', uniqid(time(), true));
        }

        $result .= $this->headerLine('Content-Type', $this->message_type . ';');
        //If we're sending a multipart message, we need to add the boundary
        if ($this->isMultipart()) {
            $result .= $this->padding(
                'boundary="' . $this->boundary[1] . '"'
            );
        }

        if ($this->Mailer !== static::MAILER_MAIL) {
            //SMTP sends the whole message at once, so we need to encode it
            //We need to tell the server what the encoding of the message is
            $result .= $this->headerLine('Content-Transfer-Encoding', $this->Encoding);
        }

        return $result;
    }

    /**
     * Create the message body.
     *
     * @return string
     */
    public function createBody()
    {
        $body = '';
        if ($this->sign_key_file) {
            $body = $this->getMailMIME() . static::$LE;
        }
        $body .= $this->MIMEBody;
        if ($this->isMultipart()) {
            //If we're sending a multipart message, we need to add the boundary
            if ($this->message_type === static::CONTENT_TYPE_MULTIPART_ALTERNATIVE) {
                //If we're sending a multipart/alternative message, we need to add the alternative body
                $body .= $this->getBoundary(
                    $this->boundary[1],
                    $this->AltBody,
                    'text/plain',
                    static::ENCODING_QUOTED_PRINTABLE
                );
                $body .= $this->getBoundary(
                    $this->boundary[1],
                    $this->Body,
                    'text/html',
                    static::ENCODING_QUOTED_PRINTABLE,
                    true
                );
            } elseif ($this->message_type === static::CONTENT_TYPE_MULTIPART_RELATED) {
                //If we're sending a multipart/related message, we need to add the related parts
                $body .= $this->getBoundary(
                    $this->boundary[1],
                    $this->Body,
                    'text/html',
                    static::ENCODING_QUOTED_PRINTABLE
                );
                foreach ($this->attachment as $attachment) {
                    if ($attachment[6] === 'inline') {
                        $body .= $this->getBoundary(
                            $this->boundary[1],
                            $attachment[0],
                            $attachment[2],
                            $attachment[3],
                            true,
                            $attachment[6],
                            $attachment[4]
                        );
                    }
                }
            } elseif ($this->message_type === static::CONTENT_TYPE_MULTIPART_MIXED) {
                //If we're sending a multipart/mixed message, we need to add the attachments
                $body .= $this->getBoundary(
                    $this->boundary[1],
                    $this->Body,
                    'text/plain',
                    static::ENCODING_QUOTED_PRINTABLE
                );
                foreach ($this->attachment as $attachment) {
                    if ($attachment[6] === 'attachment') {
                        $body .= $this->getBoundary(
                            $this->boundary[1],
                            $attachment[0],
                            $attachment[2],
                            $attachment[3],
                            true,
                            $attachment[6],
                            $attachment[4]
                        );
                    }
                }
            }
            $body .= '--' . $this->boundary[1] . '--' . static::$LE;
        } else {
            //If we're not sending a multipart message, we just add the body
            $body = $this->Body;
        }
        if ($this->sign_key_file) {
            try {
                if (!defined('PKCS7_TEXT')) {
                    throw new Exception($this->lang('extension_missing') . 'openssl');
                }
                // @codingStandardsIgnoreStart
                $file = tempnam(sys_get_temp_dir(), 'mail');
                if (false === file_put_contents($file, $body)) {
                    throw new Exception($this->lang('file_open') . $file);
                }
                $signed = tempnam(sys_get_temp_dir(), 'signed');
                if (
                    @openssl_pkcs7_sign(
                        $file,
                        $signed,
                        'file://' . realpath($this->sign_cert_file),
                        ['file://' . realpath($this->sign_key_file), $this->sign_key_pass]
                    )
                ) {
                    @unlink($file);
                    $body = file_get_contents($signed);
                    @unlink($signed);
                } else {
                    @unlink($file);
                    @unlink($signed);
                    throw new Exception($this->lang('signing') . openssl_error_string());
                }
                // @codingStandardsIgnoreEnd
            } catch (Exception $e) {
                $body = '';
                if ($this->exceptions) {
                    throw $e;
                }
            }
        }

        return $body;
    }

    /**
     * Get an S/MIME signed message.
     *
     * @return string
     */
    public function getSignedMessage()
    {
        $body = $this->MIMEHeader . static::$LE . $this->MIMEBody;
        if ($this->sign_key_file) {
            try {
                if (!defined('PKCS7_TEXT')) {
                    throw new Exception($this->lang('extension_missing') . 'openssl');
                }
                // @codingStandardsIgnoreStart
                $file = tempnam(sys_get_temp_dir(), 'mail');
                if (false === file_put_contents($file, $body)) {
                    throw new Exception($this->lang('file_open') . $file);
                }
                $signed = tempnam(sys_get_temp_dir(), 'signed');
                if (
                    @openssl_pkcs7_sign(
                        $file,
                        $signed,
                        'file://' . realpath($this->sign_cert_file),
                        ['file://' . realpath($this->sign_key_file), $this->sign_key_pass]
                    )
                ) {
                    @unlink($file);
                    $body = file_get_contents($signed);
                    @unlink($signed);
                } else {
                    @unlink($file);
                    @unlink($signed);
                    throw new Exception($this->lang('signing') . openssl_error_string());
                }
                // @codingStandardsIgnoreEnd
            } catch (Exception $e) {
                $body = '';
                if ($this->exceptions) {
                    throw $e;
                }
            }
        }

        return $body;
    }

    /**
     * Add an attachment from a path on the filesystem.
     * Returns false if the file could not be found or read.
     *
     * @param string $path        Path to the attachment
     * @param string $name        Overrides the attachment name
     * @param string $encoding    File encoding (see $Encoding)
     * @param string $type        File extension (MIME) type
     * @param string $disposition Disposition to use
     *
     * @throws Exception
     *
     * @return bool
     */
    public function addAttachment($path, $name = '', $encoding = self::ENCODING_BASE64, $type = '', $disposition = 'attachment')
    {
        try {
            if (!static::fileIsAccessible($path)) {
                throw new Exception($this->lang('file_access') . $path, self::STOP_CONTINUE);
            }
            // If a MIME type is not specified, try to work it out from the file name
            if ($type === '') {
                $type = static::filenameToType($path);
            }
            $filename = basename($path);
            if ($name === '') {
                $name = $filename;
            }
            $this->attachment[] = [
                0 => $path,
                1 => $filename,
                2 => $name,
                3 => $encoding,
                4 => $type,
                5 => false, // isStringAttachment
                6 => $disposition,
                7 => 0,
            ];
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            if ($this->exceptions) {
                throw $e;
            }
            echo $e->errorMessage();
            if ($e->getCode() === self::STOP_CRITICAL) {
                return false;
            }
        }

        return true;
    }

    /**
     * Return the array of attachments.
     *
     * @return array
     */
    public function getAttachments()
    {
        return $this->attachment;
    }

    /**
     * Add a string or binary attachment (non-filesystem).
     * This method can be used to attach ascii or binary data,
     * such as a BLOB record from a database.
     *
     * @param string $string      String attachment data
     * @param string $filename    Name of the attachment
     * @param string $encoding    File encoding (see $Encoding)
     * @param string $type        MIME type
     * @param string $disposition Disposition to use
     *
     * @return bool
     */
    public function addStringAttachment(
        $string,
        $filename,
        $encoding = self::ENCODING_BASE64,
        $type = '',
        $disposition = 'attachment'
    )
    {
        try {
            // If a MIME type is not specified, try to work it out from the file name
            if ($type === '') {
                $type = static::filenameToType($filename);
            }
            // Append to $attachment array
            $this->attachment[] = [
                0 => $string,
                1 => $filename,
                2 => basename($filename),
                3 => $encoding,
                4 => $type,
                5 => true, // isStringAttachment
                6 => $disposition,
                7 => 0,
            ];
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            if ($this->exceptions) {
                throw $e;
            }
            echo $e->errorMessage();
            if ($e->getCode() === self::STOP_CRITICAL) {
                return false;
            }
        }

        return true;
    }

    /**
     * Add an embedded (inline) attachment from a file.
     * This can include images, sounds, and just about any other document type.
     * These differ from 'regular' attachments in that they are intended to be
     * displayed inline with the message, not as a separate attachment.
     *
     * @param string $path        Path to the attachment
     * @param string $cid         Content ID of the attachment; Use this to reference
     *                            the content when using an <img src="cid:content_id"> tag
     * @param string $name        Overrides the attachment name
     * @param string $encoding    File encoding (see $Encoding)
     * @param string $type        File extension (MIME) type
     * @param string $disposition Disposition to use
     *
     * @return bool
     */
    public function addEmbeddedImage(
        $path,
        $cid,
        $name = '',
        $encoding = self::ENCODING_BASE64,
        $type = '',
        $disposition = 'inline'
    )
    {
        try {
            if (!static::fileIsAccessible($path)) {
                throw new Exception($this->lang('file_access') . $path, self::STOP_CONTINUE);
            }
            // If a MIME type is not specified, try to work it out from the file name
            if ($type === '') {
                $type = static::filenameToType($path);
            }
            $filename = basename($path);
            if ($name === '') {
                $name = $filename;
            }
            // Omit the cid if it's empty
            if (empty($cid)) {
                $cid = hash('sha1', uniqid(time(), true));
            }

            // Add to the list of embedded images
            $this->embedded_images[] = [$path, $cid, $name, $encoding, $type, $disposition];

            return true;
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            if ($this->exceptions) {
                throw $e;
            }

            return false;
        }
    }

    /**
     * Add an embedded (inline) attachment from a string.
     *
     * @param string $string      The attachment data
     * @param string $cid         Content ID of the attachment; Use this to reference
     *                            the content when using an <img src="cid:content_id"> tag
     * @param string $name        Overrides the attachment name
     * @param string $encoding    File encoding (see $Encoding)
     * @param string $type        MIME type
     * @param string $disposition Disposition to use
     *
     * @return bool
     */
    public function addStringEmbeddedImage(
        $string,
        $cid,
        $name = '',
        $encoding = self::ENCODING_BASE64,
        $type = '',
        $disposition = 'inline'
    )
    {
        // If a MIME type is not specified, try to work it out from the file name
        if ($type === '') {
            $type = static::filenameToType($name);
        }
        // Omit the cid if it's empty
        if (empty($cid)) {
            $cid = hash('sha1', uniqid(time(), true));
        }

        // Add to the list of embedded images
        $this->embedded_images[] = [$string, $cid, $name, $encoding, $type, $disposition, true];

        return true;
    }

    /**
     * Check if an embedded image exists.
     *
     * @return bool
     */
    public function inlineImageExists()
    {
        return !empty($this->embedded_images);
    }

    /**
     * Check if an attachment exists.
     *
     * @return bool
     */
    public function attachmentExists()
    {
        return !empty($this->attachment);
    }

    /**
     * Check if an alternative body exists.
     *
     * @return bool
     */
    public function alternativeExists()
    {
        return !empty($this->AltBody);
    }

    /**
     * Clear all To recipients.
     */
    public function clearAddresses()
    {
        foreach ($this->to as $to) {
            unset($this->all_recipients[strtolower($to[0])]);
        }
        $this->to = [];
    }

    /**
     * Clear all CC recipients.
     */
    public function clearCCs()
    {
        foreach ($this->cc as $cc) {
            unset($this->all_recipients[strtolower($cc[0])]);
        }
        $this->cc = [];
    }

    /**
     * Clear all BCC recipients.
     */
    public function clearBCCs()
    {
        foreach ($this->bcc as $bcc) {
            unset($this->all_recipients[strtolower($bcc[0])]);
        }
        $this->bcc = [];
    }

    /**
     * Clear all ReplyTo addresses.
     */
    public function clearReplyTos()
    {
        $this->ReplyTo = [];
    }

    /**
     * Clear all recipient types.
     */
    public function clearAllRecipients()
    {
        $this->to = [];
        $this->cc = [];
        $this->bcc = [];
        $this->all_recipients = [];
    }

    /**
     * Clear all attachments.
     */
    public function clearAttachments()
    {
        $this->attachment = [];
    }

    /**
     * Clear all custom headers.
     */
    public function clearCustomHeaders()
    {
        $this->CustomHeader = [];
    }

    /**
     * Add a custom header.
     *
     * @param string $name  Custom header name
     * @param string $value Header value
     */
    public function addCustomHeader($name, $value = null)
    {
        if (null === $value) {
            //Ex GMAIL-X-GM-THRID O3456789
            $this->CustomHeader[] = explode(':', $name, 2);

            return;
        }
        //Don't allow to overwrite some of crucial PHPMailer headers
        if (in_array(strtolower($name), [
            'to',
            'cc',
            'bcc',
            'from',
            'subject',
            'content-type',
            'content-transfer-encoding',
            'reply-to',
        ], true)) {
            return;
        }

        $this->CustomHeader[] = [$name, $value];
    }

    /**
     * Add an RFC 822 formatted header.
     *
     * @param string $name
     * @param string $value
     */
    public function addRFC822Header($name, $value)
    {
        //Validate the name
        if (preg_match('/[a-zA-Z0-9-]{1,}/', $name) !== 1) {
            return;
        }

        //Don't allow to overwrite some of crucial PHPMailer headers
        if (in_array(strtolower($name), [
            'to',
            'cc',
            'bcc',
            'from',
            'subject',
            'content-type',
            'content-transfer-encoding',
            'reply-to',
        ], true)) {
            return;
        }

        $this->RFC822Header[] = [$name, $value];
    }

    /**
     * Return the custom headers.
     *
     * @return array
     */
    public function getCustomHeaders()
    {
        return $this->CustomHeader;
    }

    /**
     * Create a message from a DOMDocument.
     *
     * @param \DOMDocument $dom
     * @param bool         $basedir
     * @param bool         $advanced
     *
     * @return string
     */
    public function msgHTML($message, $basedir = '', $advanced = false)
    {
        if ($advanced) {
            //Create a new DOMDocument
            $dom = new \DOMDocument();
            //Load the HTML
            $dom->loadHTML($message);

            //Create the message body
            $this->Body = $this->html2text($dom, $basedir, $advanced);
        } else {
            $this->Body = $message;
        }
        $this->AltBody = $this->html2text($this->Body, $basedir, $advanced);
    }

    /**
     * Create a text-only message from an HTML string.
     * This method will remove all HTML tags, but will still preserve line breaks.
     * It will also convert some common HTML entities to their text equivalents.
     *
     * @param string $html
     * @param string $basedir
     * @param bool   $advanced
     *
     * @return string
     */
    public function html2text($html, $basedir = '', $advanced = false)
    {
        if ($advanced) {
            //Create a new DOMDocument
            $dom = new \DOMDocument();
            //Load the HTML
            $dom->loadHTML($html);

            //Create the message body
            $text = '';
            //Get all the nodes
            $nodes = $dom->getElementsByTagName('*');
            foreach ($nodes as $node) {
                //If the node is a text node, add it to the message body
                if ($node->nodeType === XML_TEXT_NODE) {
                    $text .= $node->nodeValue;
                }
            }

            return $text;
        }

        return html_entity_decode(
            trim(strip_tags(preg_replace('/<(head|title|style|script)[^>]*>.*?<\/\1>/si', '', $html))),
            ENT_QUOTES,
            $this->CharSet
        );
    }

    /**
     * Get the word-wrapped version of a string.
     *
     * @param string $message
     * @param int    $length
     * @param bool   $qp_mode
     *
     * @return string
     */
    public function getWordWrap($message, $length, $qp_mode = false)
    {
        if ($length < 1) {
            return $message;
        }
        if ($qp_mode) {
            $soft_break = ' =' . static::$LE;
        } else {
            $soft_break = static::$LE;
        }
        //If utf-8 encoding is used, we will need to make sure there are no
        //overlong sequences in the string, and count the characters instead of bytes.
        if ($this->CharSet === self::CHARSET_UTF8) {
            $lines = [];
            $line = '';
            $words = explode(' ', $message);
            foreach ($words as $word) {
                if (mb_strlen($line . $word, $this->CharSet) > $length) {
                    $lines[] = $line;
                    $line = '';
                }
                $line .= $word . ' ';
            }
            $lines[] = $line;
            $message = implode(static::$LE, $lines);
        } else {
            //Wrap the message
            $message = wordwrap($message, $length, $soft_break, true);
        }

        return $message;
    }

    /**
     * Assemble the message for sending.
     *
     * @return string
     */
    public function getMIMEHeader()
    {
        return $this->MIMEHeader;
    }

    /**
     * Assemble the message body for sending.
     *
     * @return string
     */
    public function getMIMEBody()
    {
        return $this->MIMEBody;
    }

    /**
     * Returns the whole MIME message.
     *
     * @return string
     */
    public function getSentMIMEMessage()
    {
        return $this->MIMEHeader . $this->MIMEBody . static::$LE;
    }

    /**
     * Get the MIME boundary.
     *
     * @param string $boundary
     * @param string $body
     * @param string $mime_type
     * @param string $encoding
     * @param bool   $is_last
     * @param string $disposition
     * @param string $cid
     *
     * @return string
     */
    protected function getBoundary(
        $boundary,
        $body,
        $mime_type,
        $encoding,
        $is_last = false,
        $disposition = '',
        $cid = ''
    )
    {
        $result = '';
        if ($this->isMIME()) {
            $result .= '--' . $boundary . static::$LE;
            $result .= 'Content-Type: ' . $mime_type;
            if ($this->CharSet !== '') {
                $result .= '; charset=' . $this->CharSet;
            }
            $result .= static::$LE;
            if ($encoding !== '') {
                $result .= 'Content-Transfer-Encoding: ' . $encoding . static::$LE;
            }
            if ($disposition !== '') {
                $result .= 'Content-Disposition: ' . $disposition;
                if ($cid !== '') {
                    $result .= '; filename="' . $cid . '"';
                }
                $result .= static::$LE;
            }
            if ($cid !== '') {
                $result .= 'Content-ID: <' . $cid . '>' . static::$LE;
            }
            $result .= static::$LE;
        }
        $result .= $this->encodeString($body, $encoding);
        if ($is_last) {
            $result .= static::$LE . '--' . $boundary . '--' . static::$LE;
        }

        return $result;
    }

    /**
     * Check if the message is multipart.
     *
     * @return bool
     */
    public function isMultipart()
    {
        return strpos($this->message_type, 'multipart/') === 0;
    }

    /**
     * Check if the message is of a given type.
     *
     * @param string $type
     *
     * @return bool
     */
    public function isMIME()
    {
        return strpos($this->ContentType, 'multipart/') !== 0;
    }

    /**
     * Set the body of the message.
     *
     * @param string $body
     */
    public function setBody($body)
    {
        $this->Body = $body;
    }

    /**
     * Get the body of the message.
     *
     * @return string
     */
    public function getBody()
    {
        return $this->Body;
    }

    /**
     * Set the subject of the message.
     *
     * @param string $subject
     */
    public function setSubject($subject)
    {
        $this->Subject = $subject;
    }

    /**
     * Get the subject of the message.
     *
     * @return string
     */
    public function getSubject()
    {
        return $this->Subject;
    }

    /**
     * Set the From address of the message.
     *
     * @param string $address
     * @param string $name
     * @param bool   $auto
     */
    public function setFromAddress($address, $name = '', $auto = true)
    {
        $this->setFrom($address, $name, $auto);
    }

    /**
     * Get the From address of the message.
     *
     * @return string
     */
    public function getFrom()
    {
        return $this->From;
    }

    /**
     * Get the From name of the message.
     *
     * @return string
     */
    public function getFromName()
    {
        return $this->FromName;
    }

    /**
     * Set the Sender of the message.
     *
     * @param string $address
     */
    public function setSender($address)
    {
        $this->Sender = $address;
    }

    /**
     * Get the Sender of the message.
     *
     * @return string
     */
    public function getSender()
    {
        return $this->Sender;
    }

    /**
     * Get the Priority of the message.
     *
     * @return int
     */
    public function getPriority()
    {
        return $this->Priority;
    }

    /**
     * Set the Priority of the message.
     *
     * @param int $priority
     */
    public function setPriority($priority)
    {
        $this->Priority = $priority;
    }

    /**
     * Set the CharSet of the message.
     *
     * @param string $charSet
     */
    public function setCharSet($charSet)
    {
        $this->CharSet = $charSet;
    }

    /**
     * Get the CharSet of the message.
     *
     * @return string
     */
    public function getCharSet()
    {
        return $this->CharSet;
    }

    /**
     * Set the ContentType of the message.
     *
     * @param string $contentType
     */
    public function setContentType($contentType)
    {
        $this->ContentType = $contentType;
    }

    /**
     * Get the ContentType of the message.
     *
     * @return string
     */
    public function getContentType()
    {
        return $this->ContentType;
    }

    /**
     * Set the Encoding of the message.
     *
     * @param string $encoding
     */
    public function setEncoding($encoding)
    {
        $this->Encoding = $encoding;
    }

    /**
     * Get the Encoding of the message.
     *
     * @return string
     */
    public function getEncoding()
    {
        return $this->Encoding;
    }

    /**
     * Set the ErrorInfo of the message.
     *
     * @param string $errorInfo
     */
    public function setErrorInfo($errorInfo)
    {
        $this->ErrorInfo = $errorInfo;
    }

    /**
     * Get the ErrorInfo of the message.
     *
     * @return string
     */
    public function getErrorInfo()
    {
        return $this->ErrorInfo;
    }

    /**
     * Set the From of the message.
     *
     * @param string $from
     */
    public function setFromEmail($from)
    {
        $this->From = $from;
    }

    /**
     * Get the From of the message.
     *
     * @return string
     */
    public function getFromEmail()
    {
        return $this->From;
    }

    /**
     * Set the From name of the message.
     *
     * @param string $fromName
     */
    public function setFromNameEmail($fromName)
    {
        $this->FromName = $fromName;
    }

    /**
     * Get the From name of the message.
     *
      * @return string
     */
    public function getFromNameEmail()
    {
        return $this->FromName;
    }

    /**
     * Set the Sender of the message.
     *
     * @param string $sender
     */
    public function setSenderEmail($sender)
    {
        $this->Sender = $sender;
    }

    /**
     * Get the Sender of the message.
     *
     * @return string
     */
    public function getSenderEmail()
    {
        return $this->Sender;
    }

    /**
     * Get the Body of the message.
     *
     * @return string
     */
    public function getMessage()
    {
        return $this->Body;
    }

    /**
     * Set the Body of the message.
     *
     * @param string $message
     */
    public function setMessage($message)
    {
        $this->Body = $message;
    }

    /**
     * Add a generic address.
     *
     * @param string $kind
     * @param string $address
     * @param string $name
     *
     * @return bool
     */
    protected function addAddressByType($kind, $address, $name)
    {
        return $this->addAnAddress($kind, $address, $name);
    }

    /**
     * Add an address to the appropriate list.
     *
     * @param string $kind
     * @param string $address
     * @param string $name
     *
     * @return bool
     */
    protected function addAnAddressToList($kind, $address, $name)
    {
        if (!in_array($kind, ['to', 'cc', 'bcc', 'Reply-To'], true)) {
            $error_message = sprintf(
                '%s: %s',
                $this->lang('invalid_address'),
                $kind
            );
            $this->setError($error_message);
            if ($this->exceptions) {
                throw new Exception($error_message);
            }
            echo $error_message . self::$LE;

            return false;
        }
        if (!static::validateAddress($address)) {
            $error_message = sprintf(
                '%s (%s): %s',
                $this->lang('invalid_address'),
                $kind,
                $address
            );
            $this->setError($error_message);
            if ($this->exceptions) {
                throw new Exception($error_message);
            }
            echo $error_message . self::$LE;

            return false;
        }
        if ($kind !== 'Reply-To') {
            if (!array_key_exists(strtolower($address), $this->all_recipients)) {
                $this->{$kind}[] = [$address, $name];
                $this->all_recipients[strtolower($address)] = true;

                return true;
            }
        } else {
            if (!array_key_exists(strtolower($address), $this->ReplyTo)) {
                $this->ReplyTo[strtolower($address)] = [$address, $name];

                return true;
            }
        }

        return false;
    }
}
