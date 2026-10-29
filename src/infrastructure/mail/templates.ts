export type MailContent = { subject: string; text: string };

export function signupCodeMail(code: string): MailContent {
  return {
    subject: "Seu código do Mkt Control",
    text: `Seu código de verificação do Mkt Control é ${code}.\n\nEle expira em 10 minutos. Se você não pediu este código, ignore esta mensagem.`,
  };
}

export function resetCodeMail(code: string): MailContent {
  return {
    subject: "Redefinição de senha do Mkt Control",
    text: `Use o código ${code} para redefinir a senha da sua conta no Mkt Control.\n\nEle expira em 10 minutos. Se você não pediu a redefinição, ignore esta mensagem.`,
  };
}

export function inviteMail(input: {
  name: string;
  storeName: string;
  code: string;
}): MailContent {
  return {
    subject: "Você foi convidado para o Mkt Control",
    text: `Olá, ${input.name}!\n\nVocê foi convidado para acessar o Mkt Control da loja ${input.storeName}.\n\nPara criar sua senha, abra a página /recuperar do sistema, informe seu e-mail e o código ${input.code}.\n\nO código expira em 48 horas.`,
  };
}
