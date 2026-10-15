"use client";

import React from "react";
import { X } from "lucide-react";
import { EMAIL_PROVIDERS } from "@brokeros/constants";
import type { EmailProviderType } from "@/features/marketing/types";
import { Button } from "@/components/ui/Button";

export interface ConnectProviderModalProps {
  selectedProvider: EmailProviderType | null;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function ConnectProviderModal({
  selectedProvider,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: ConnectProviderModalProps) {
  if (!selectedProvider) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 shadow-xl space-y-4 animate-enter">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Connect {(EMAIL_PROVIDERS as Record<string, any>)[selectedProvider]?.name || selectedProvider}
            </h3>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Configure your provider credentials for live delivery.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
              Account Nickname
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                Default From Name
              </label>
              <input
                type="text"
                required
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                Default From Email
              </label>
              <input
                type="email"
                required
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* AWS SES Credentials */}
          {selectedProvider === "AWS_SES" && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="AKIA..."
                  value={formData.awsAccessKeyId}
                  onChange={(e) => setFormData({ ...formData, awsAccessKeyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={formData.awsSecretKey}
                  onChange={(e) => setFormData({ ...formData, awsSecretKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  AWS Region
                </label>
                <input
                  type="text"
                  required
                  placeholder="ap-south-1"
                  value={formData.awsRegion}
                  onChange={(e) => setFormData({ ...formData, awsRegion: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {/* SendGrid / Brevo Credentials */}
          {(selectedProvider === "SENDGRID" || selectedProvider === "BREVO") && (
            <div>
              <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                API Secret Key
              </label>
              <input
                type="password"
                required
                placeholder={selectedProvider === "SENDGRID" ? "SG...." : "xkeysib-...."}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
              />
            </div>
          )}

          {/* Mailchimp Credentials */}
          {selectedProvider === "MAILCHIMP" && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Mailchimp API Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 7c8d9e0f...-us20"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Data Center Prefix (Server)
                </label>
                <input
                  type="text"
                  required
                  placeholder="us20"
                  value={formData.mailchimpServer}
                  onChange={(e) => setFormData({ ...formData, mailchimpServer: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {/* Mailgun Credentials */}
          {selectedProvider === "MAILGUN" && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Mailgun Private API Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Sending Domain
                </label>
                <input
                  type="text"
                  required
                  placeholder="mg.yourbrokerage.com"
                  value={formData.mailgunDomain}
                  onChange={(e) => setFormData({ ...formData, mailgunDomain: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Mailgun Region
                </label>
                <select
                  value={formData.mailgunRegion}
                  onChange={(e) => setFormData({ ...formData, mailgunRegion: e.target.value as 'US' | 'EU' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                >
                  <option value="US">US Region (api.mailgun.net)</option>
                  <option value="EU">EU Frankfurt (api.eu.mailgun.net)</option>
                </select>
              </div>
            </>
          )}

          {/* Gmail / Google Workspace Credentials */}
          {selectedProvider === "GMAIL" && (
            <>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authType: "app_password" })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    formData.authType === "app_password"
                      ? "bg-white text-[var(--brand-600)] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Google App Password (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authType: "oauth" })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    formData.authType === "oauth"
                      ? "bg-white text-[var(--brand-600)] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  OAuth 2.0 Client
                </button>
              </div>

              {formData.authType === "app_password" ? (
                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                    Google App Password (16 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={formData.googleAppPassword}
                    onChange={(e) => setFormData({ ...formData, googleAppPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Generate via Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                      Google OAuth Client ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                      value={formData.oauthClientId}
                      onChange={(e) => setFormData({ ...formData, oauthClientId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                      OAuth Client Secret
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      value={formData.oauthClientSecret}
                      onChange={(e) => setFormData({ ...formData, oauthClientSecret: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                      OAuth Refresh Token
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="1//0xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={formData.oauthRefreshToken}
                      onChange={(e) => setFormData({ ...formData, oauthRefreshToken: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Microsoft 365 / Outlook Credentials */}
          {selectedProvider === "OUTLOOK" && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Azure Application (Client) ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={formData.oauthClientId}
                  onChange={(e) => setFormData({ ...formData, oauthClientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Client Secret Value
                </label>
                <input
                  type="password"
                  required
                  placeholder="Azure app secret value"
                  value={formData.oauthClientSecret}
                  onChange={(e) => setFormData({ ...formData, oauthClientSecret: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Azure Tenant ID
                </label>
                <input
                  type="text"
                  placeholder="common (or your Azure Tenant GUID)"
                  value={formData.oauthTenantId}
                  onChange={(e) => setFormData({ ...formData, oauthTenantId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  OAuth Refresh Token
                </label>
                <input
                  type="password"
                  placeholder="Delegated user refresh token (optional if using Bearer token below)"
                  value={formData.oauthRefreshToken}
                  onChange={(e) => setFormData({ ...formData, oauthRefreshToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Direct Bearer Token (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Pre-generated Microsoft Graph Bearer access token"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {/* Constant Contact Credentials */}
          {selectedProvider === "CONSTANT_CONTACT" && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Constant Contact Access Token / API Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Constant Contact API Key or Bearer Token"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  OAuth Refresh Token (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Optional refresh token for auto renewal"
                  value={formData.oauthRefreshToken}
                  onChange={(e) => setFormData({ ...formData, oauthRefreshToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying Credentials..." : "Test & Save Provider"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
