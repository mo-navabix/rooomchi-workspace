# LDAP / Active Directory

## Per-organization configuration

Store in `organization_auth_settings.ldap_configuration` (JSON):

```json
{
  "url": "ldap://dc.company.local:389",
  "bindDn": "CN=svc-rooomchi,OU=Service Accounts,DC=company,DC=local",
  "bindPassword": "<secret>",
  "baseDn": "DC=company,DC=local",
  "userFilter": "(|(sAMAccountName={username})(userPrincipalName={username})(mail={username}))",
  "emailAttribute": "mail",
  "nameAttribute": "displayName",
  "defaultRole": "EMPLOYEE",
  "useTls": false
}
```

Enable with `ldap_enabled: true` on the same row.

Environment variables (`LDAP_URL`, `LDAP_BIND_DN`, …) are used only as **fallback** when a field is missing in org JSON.

## Login

`POST /api/auth/ldap/login`

```json
{
  "username": "jdoe",
  "password": "***",
  "organizationId": "org-1"
}
```

## Provisioning

On first successful bind, Rooomchi creates a user and a `user_external_identities` row (`provider: ldap`).

## Group → role mapping

Table `ldap_group_role_mappings`:

| ldap_group | role |
|------------|------|
| Roomchi Admins | ORGANIZATION_ADMIN |
| Roomchi Users | EMPLOYEE |

Managed via `PUT /api/organizations/:id/auth-settings` with `ldapGroupRoleMappings`.
