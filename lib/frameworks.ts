export const frameworks = [
  {
    id: "smb1001",
    name: "SMB1001",
    sections: [
      {
        id: "access_control",
        name: "Access Control",
        controls: [
          {
            id: "ac-1",
            title: "Multi-Factor Authentication",
            questions: [
              {
                key: "smb_mfa_enabled",
                text: "Is MFA enforced for all users accessing company resources?",
                type: "boolean",
                overlaps: [
                  { framework: "essential_eight", control: "mfa_1" },
                  { framework: "nist_csf", control: "PR.AA-1" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "essential_eight",
    name: "ASD Essential Eight",
    sections: [
      {
        id: "mfa",
        name: "Multi-Factor Authentication",
        controls: [
          {
            id: "e8-mfa",
            title: "MFA usage",
            questions: [
              {
                key: "e8_mfa_coverage",
                text: "Does the organisation enforce phishing-resistant MFA?",
                type: "boolean",
                overlaps: [
                  { framework: "smb1001", control: "ac-1" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
