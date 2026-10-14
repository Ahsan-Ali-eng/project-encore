

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@clerk/react";

import { apiRequest } from "../../services/api.js";



const STATUS_LABELS = {

  NOT_CONFIGURED: "Not configured",

  PENDING: "Verification pending",

  VERIFIED: "Domain verified",

  ERROR: "Verification error",

};



function getDomainFromEmail(email) {

  const normalizedEmail = email.trim().toLowerCase();

  const separator = normalizedEmail.lastIndexOf("@");



  return separator > 0 ? normalizedEmail.slice(separator + 1) : "";

}



function isReservedTestDomain(domain) {
  return (
    domain === "example" ||
    domain.endsWith(".example") ||
    domain === "test" ||
    domain.endsWith(".test") ||
    domain === "localhost"
  );
}

export default function Settings() {

  const { isLoaded, isSignedIn, getToken } = useAuth();



  const [formData, setFormData] = useState({

    senderName: "",

    senderEmail: "",

    replyToEmail: "",

  });




  const [resendDomainId, setResendDomainId] = useState(null);

  const [verificationStatus, setVerificationStatus] =

    useState("NOT_CONFIGURED");

  const [verificationError, setVerificationError] = useState("");

  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);

  const [dnsRecords, setDnsRecords] = useState([]);



  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [isRegisteringDomain, setIsRegisteringDomain] = useState(false);

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [isRequestingVerification, setIsRequestingVerification] =

    useState(false);



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const loadEmailSettings = useCallback(async () => {

    const token = await getToken();



    if (!token) {

      throw new Error("Your session has expired. Please sign in again.");

    }



    const data = await apiRequest("/emails/settings", {}, token);



    setFormData({

      senderName: data.senderName || "",

      senderEmail: data.senderEmail || "",

      replyToEmail: data.replyToEmail || "",

    });




    setResendDomainId(data.resendDomainId || null);

    setVerificationStatus(

      data.verificationStatus || "NOT_CONFIGURED"

    );

    setVerificationError(data.verificationError || "");

    setLastVerifiedAt(data.lastVerifiedAt || null);



    return data;

  }, [getToken]);



  const refreshDomainStatus = useCallback(async () => {

    const token = await getToken();



    if (!token) {

      throw new Error("Your session has expired. Please sign in again.");

    }



    const data = await apiRequest(

      "/emails/domains/status",

      {},

      token

    );




    setVerificationStatus(

      data.verificationStatus || "NOT_CONFIGURED"

    );

    setVerificationError(data.verificationError || "");

    setLastVerifiedAt(data.lastVerifiedAt || null);

    setDnsRecords(Array.isArray(data.records) ? data.records : []);



    return data;

  }, [getToken]);



  useEffect(() => {

    if (!isLoaded) return;



    if (!isSignedIn) {
      return;
    }



    let cancelled = false;



    async function loadPage() {

      try {

        setError("");



        await loadEmailSettings();



        if (cancelled) return;



        await refreshDomainStatus();

      } catch (err) {

        if (!cancelled) {

          setError(err.message || "Unable to load email settings.");

        }

      } finally {

        if (!cancelled) {

          setIsLoading(false);

        }

      }

    }



    loadPage();



    return () => {

      cancelled = true;

    };

  }, [isLoaded, isSignedIn, loadEmailSettings, refreshDomainStatus]);



  function handleChange(event) {

    const { name, value } = event.target;



    setFormData((previous) => ({

      ...previous,

      [name]: value,

    }));



    setSuccess("");

    setError("");

  }



  async function handleSubmit(event) {

    event.preventDefault();



    setError("");

    setSuccess("");

    setIsSaving(true);



    try {

      const token = await getToken();



      if (!token) {

        throw new Error("Your session has expired. Please sign in again.");

      }



      const data = await apiRequest(

        "/emails/settings",

        {

          method: "PUT",

          body: JSON.stringify({

            senderName: formData.senderName.trim(),

            senderEmail: formData.senderEmail.trim(),

            replyToEmail: formData.replyToEmail.trim(),

          }),

        },

        token

      );



      setFormData({

        senderName: data.senderName || "",

        senderEmail: data.senderEmail || "",

        replyToEmail: data.replyToEmail || "",

      });




      setResendDomainId(data.resendDomainId || null);

      setVerificationStatus(

        data.verificationStatus || "NOT_CONFIGURED"

      );

      setVerificationError(data.verificationError || "");

      setLastVerifiedAt(data.lastVerifiedAt || null);

      setDnsRecords([]);



      setSuccess(

        "Email settings saved. Check your sending-domain status before registering or verifying a domain."

      );

    } catch (err) {

      setError(err.message || "Unable to save email settings.");

    } finally {

      setIsSaving(false);

    }

  }



  async function handleRegisterDomain() {

    setError("");

    setSuccess("");

    setIsRegisteringDomain(true);



    try {

      const token = await getToken();



      if (!token) {

        throw new Error("Your session has expired. Please sign in again.");

      }



      const senderDomain = getDomainFromEmail(formData.senderEmail);
      const isTestDomain = isReservedTestDomain(senderDomain);

      if (isTestDomain) {
        throw new Error(
          "This is a reserved test domain. Use a real domain your business owns before registering it with the email provider."
        );
      }



      if (!formData.senderName.trim() || !formData.senderEmail.trim()) {

        throw new Error(

          "Save your sender name and sender email before registering a domain."

        );

      }



      if (!senderDomain) {

        throw new Error("Enter a valid sender email address first.");

      }



      const data = await apiRequest(

        "/emails/domains",

        {

          method: "POST",

          body: JSON.stringify({ domain: senderDomain }),

        },

        token

      );



      if (data.settings) {


        setResendDomainId(data.settings.resendDomainId || null);

        setVerificationStatus(

          data.settings.verificationStatus || "PENDING"

        );

        setVerificationError(data.settings.verificationError || "");

        setLastVerifiedAt(data.settings.lastVerifiedAt || null);

      }



      if (data.domain?.records) {

        setDnsRecords(data.domain.records);

      }



      setSuccess(

        "Domain registration requested. Check the DNS records and add them at your domain provider."

      );



      await refreshDomainStatus();

    } catch (err) {

      setError(err.message || "Unable to register your sending domain.");

    } finally {

      setIsRegisteringDomain(false);

    }

  }



  async function handleCheckStatus() {

    setError("");

    setSuccess("");

    setIsCheckingStatus(true);



    try {

      await refreshDomainStatus();

      setSuccess("Domain verification status refreshed.");

    } catch (err) {

      setError(err.message || "Unable to refresh domain status.");

    } finally {

      setIsCheckingStatus(false);

    }

  }



  async function handleRequestVerification() {

    setError("");

    setSuccess("");

    setIsRequestingVerification(true);



    try {

      const token = await getToken();



      if (!token) {

        throw new Error("Your session has expired. Please sign in again.");

      }



      await apiRequest(

        "/emails/domains/verify",

        { method: "POST" },

        token

      );



      setSuccess(

        "Verification requested. Allow time for DNS changes to propagate, then check the status again."

      );

    } catch (err) {

      setError(err.message || "Unable to request domain verification.");

    } finally {

      setIsRequestingVerification(false);

    }

  }



  if (!isLoaded || (isSignedIn && isLoading)) {

    return (

      <div className="p-6 text-encore-text-secondary">

        Loading email settings...

      </div>

    );

  }



  if (!isSignedIn) {

    return (

      <div className="p-6 text-encore-text-secondary">

        Please sign in to manage your email settings.

      </div>

    );

  }



  const senderDomain = getDomainFromEmail(formData.senderEmail);
  const isTestDomain = isReservedTestDomain(senderDomain);

  const hasSavedSender =

    Boolean(formData.senderName.trim()) &&

    Boolean(formData.senderEmail.trim()) &&

    Boolean(formData.replyToEmail.trim());



  return (

    <div className="mx-auto max-w-4xl space-y-6 p-6 text-encore-text">

      <div>

        <h1 className="text-2xl font-bold">Email Settings</h1>

        <p className="mt-2 text-encore-text-secondary">

          Configure the sender identity Encore will use for your

          business's automated emails.

        </p>

      </div>



      <section className="space-y-4 rounded-xl border border-encore-border bg-encore-surface p-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold">Sending domain</h2>

            <p className="mt-1 text-sm text-encore-text-secondary">

              Verify a domain your business owns before sending automated

              emails. Encore will not send live emails while verification

              is incomplete.

            </p>

          </div>



          <span className="w-fit shrink-0 rounded-full border border-encore-border px-3 py-1 text-sm">

            {STATUS_LABELS[verificationStatus] || "Status unavailable"}

          </span>

        </div>



        <div className="rounded-lg border border-encore-border bg-encore-background p-4">

          <p className="text-sm text-encore-text-secondary">

            Sender domain

          </p>

          <p className="mt-1 break-all font-medium">

            {senderDomain || "Enter a sender email first"}

          </p>



          {resendDomainId && (

            <p className="mt-2 text-xs text-encore-text-muted">

              Domain registered with the email provider.

            </p>

          )}



          {lastVerifiedAt && (

            <p className="mt-2 text-xs text-encore-text-muted">

              Last verified: {new Date(lastVerifiedAt).toLocaleString()}

            </p>

          )}

        </div>



        {verificationError && (

          <div

            role="alert"

            className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"

          >

            {verificationError}

          </div>

        )}



        <div className="flex flex-wrap gap-3">

          <button

            type="button"

            onClick={handleRegisterDomain}

            disabled={

              isRegisteringDomain ||

              !hasSavedSender ||

              isTestDomain ||

              Boolean(resendDomainId)

            }

            className="rounded-lg bg-encore-primary px-4 py-2.5 font-medium text-white transition hover:bg-encore-primary-hover disabled:cursor-not-allowed disabled:opacity-50"

          >

            {isRegisteringDomain

              ? "Registering..."

              : resendDomainId

                ? "Domain registered"

                : "Register sending domain"}

          </button>



          <button

            type="button"

            onClick={handleCheckStatus}

            disabled={isCheckingStatus}

            className="rounded-lg border border-encore-border px-4 py-2.5 font-medium transition hover:bg-encore-background disabled:cursor-not-allowed disabled:opacity-50"

          >

            {isCheckingStatus ? "Checking..." : "Check status"}

          </button>



          {resendDomainId && verificationStatus !== "VERIFIED" && (

            <button

              type="button"

              onClick={handleRequestVerification}

              disabled={isRequestingVerification}

              className="rounded-lg border border-encore-border px-4 py-2.5 font-medium transition hover:bg-encore-background disabled:cursor-not-allowed disabled:opacity-50"

            >

              {isRequestingVerification

                ? "Requesting..."

                : "Request DNS verification"}

            </button>

          )}

        </div>



        {!hasSavedSender && (

          <p className="text-sm text-encore-text-muted">

            Save all sender settings below before registering your domain.

          </p>

        )}



        {isTestDomain && (

          <p className="text-sm text-amber-300">

            This is a test domain. Enter an email address on a real domain your

            business owns before registering it with the email provider.

          </p>

        )}



        <p className="text-sm text-encore-text-muted">

          Registering a domain does not change your DNS records automatically.

          You must add the records supplied by the email provider at your

          domain registrar or DNS host.

        </p>



        {dnsRecords.length > 0 && (

          <div className="space-y-3">

            <h3 className="font-semibold">DNS records</h3>

            <p className="text-sm text-encore-text-secondary">

              Use these records to configure your domain. Copy the exact

              values provided by the email provider.

            </p>



            {dnsRecords.map((record, index) => (

              <div

                key={`${record.type || "record"}-${record.name || index}-${index}`}

                className="space-y-2 rounded-lg border border-encore-border bg-encore-background p-3 text-sm"

              >

                <div>

                  <span className="text-encore-text-muted">Type: </span>

                  <span>{record.type || "DNS record"}</span>

                </div>

                <div>

                  <span className="text-encore-text-muted">Name: </span>

                  <span className="break-all">{record.name || "—"}</span>

                </div>

                <div>

                  <span className="text-encore-text-muted">Value: </span>

                  <span className="break-all">

                    {record.value || record.content || "—"}

                  </span>

                </div>

                {record.priority !== undefined && (

                  <div>

                    <span className="text-encore-text-muted">

                      Priority:{" "}

                    </span>

                    <span>{record.priority}</span>

                  </div>

                )}

              </div>

            ))}

          </div>

        )}

      </section>



      <form

        onSubmit={handleSubmit}

        className="space-y-5 rounded-xl border border-encore-border bg-encore-surface p-5"

      >

        <div>

          <h2 className="text-lg font-semibold">Sender identity</h2>

          <p className="mt-1 text-sm text-encore-text-secondary">

            Customers will see your sender name and email address. Replies

            will go to your chosen reply-to address.

          </p>

        </div>



        <div>

          <label

            htmlFor="senderName"

            className="mb-2 block text-sm font-medium"

          >

            Sender name

          </label>

          <input

            id="senderName"

            name="senderName"

            type="text"

            required

            maxLength={100}

            value={formData.senderName}

            onChange={handleChange}

            placeholder="ABC Dental"

            autoComplete="organization"

            className="w-full rounded-lg border border-encore-border bg-encore-background px-4 py-3 text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"

          />

        </div>



        <div>

          <label

            htmlFor="senderEmail"

            className="mb-2 block text-sm font-medium"

          >

            Sender email

          </label>

          <input

            id="senderEmail"

            name="senderEmail"

            type="email"

            required

            maxLength={254}

            value={formData.senderEmail}

            onChange={handleChange}

            placeholder="appointments@abcdental.ca"

            autoComplete="email"

            className="w-full rounded-lg border border-encore-border bg-encore-background px-4 py-3 text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"

          />

          <p className="mt-1 text-xs text-encore-text-muted">

            Use an address on a domain your business owns, not a personal

            Gmail or Outlook address.

          </p>

        </div>



        <div>

          <label

            htmlFor="replyToEmail"

            className="mb-2 block text-sm font-medium"

          >

            Reply-to email

          </label>

          <input

            id="replyToEmail"

            name="replyToEmail"

            type="email"

            required

            maxLength={254}

            value={formData.replyToEmail}

            onChange={handleChange}

            placeholder="appointments@abcdental.ca"

            autoComplete="email"

            className="w-full rounded-lg border border-encore-border bg-encore-background px-4 py-3 text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"

          />

          <p className="mt-1 text-xs text-encore-text-muted">

            Customer replies will go to this address in your existing inbox.

            Encore does not connect to that inbox in this phase.

          </p>

        </div>



        {error && (

          <div

            role="alert"

            className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"

          >

            {error}

          </div>

        )}



        {success && (

          <div

            role="status"

            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300"

          >

            {success}

          </div>

        )}



        <button

          type="submit"

          disabled={isSaving}

          className="rounded-lg bg-encore-primary px-5 py-3 font-medium text-white transition hover:bg-encore-primary-hover disabled:cursor-not-allowed disabled:opacity-60"

        >

          {isSaving ? "Saving..." : "Save email settings"}

        </button>

      </form>

    </div>

  );

}
