import { authenticated } from './WebRequest';

export default class LicensingAPI {
  static LicenseStatus() {
    return authenticated.get('/licensing/status');
  }

  static ActivateOnline(licensecode) {
    return authenticated.post('/licensing/activate_online', { licensecode });
  }

  static DeactivateOnline() {
    return authenticated.get('/licensing/deactivate_online');
  }

  static ActivationCertificateRequest(licensecode) {
    return authenticated.post('/licensing/activation_certificate_request', {
      licensecode,
    });
  }

  static ActivateOffline(certificate) {
    return authenticated.post('/licensing/activate_offline', { certificate });
  }

  static ActivationCertificateReset() {
    return authenticated.get('/licensing/activation_certificate_reset');
  }

  static DeactivationCertificateRequest() {
    return authenticated.get('/licensing/deactivation_certificate_request');
  }

  static ErrorMessage(error_no) {
    return authenticated.post('/licensing/activate_offline', { error_no });
  }

  static VersionInfo() {
    return authenticated.get('/licensing/version_info');
  }
}
