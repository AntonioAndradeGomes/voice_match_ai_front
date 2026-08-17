// Texto dos Termos de Uso apresentados ao candidato antes da inscrição.
//
// ATENÇÃO: esta é uma redação de trabalho, escrita para a tela existir e o
// fluxo funcionar. NÃO passou por revisão jurídica. Antes de ir para produção,
// o time responsável precisa revisar — em especial os trechos sobre decisão
// automatizada, retenção e compartilhamento, que envolvem obrigações da LGPD.
// Trocar o conteúdo daqui não exige mexer em componente nenhum.

// Muda a cada alteração do texto: a versão aceita é o que dá sentido a um
// registro de aceite. A 1.1 acrescentou a declaração voluntária de PCD.
export const TERMOS_VERSAO = "1.1";
export const TERMOS_ATUALIZADO_EM = "16 de agosto de 2026";

export interface SecaoTermos {
    titulo: string;
    paragrafos: string[];
}

export const SECOES_TERMOS: SecaoTermos[] = [
    {
        titulo: "1. Sobre estes termos",
        paragrafos: [
            "Ao se inscrever nesta vaga, você declara que leu e concorda com as condições descritas abaixo. A inscrição é voluntária e você pode desistir do processo a qualquer momento, sem qualquer prejuízo.",
            "Estes termos tratam apenas da sua participação no processo seletivo conduzido pela plataforma VoiceMatch.Ai. Eles não criam vínculo empregatício, promessa de contratação ou obrigação de resposta em prazo determinado.",
        ],
    },
    {
        titulo: "2. Como funciona o processo",
        paragrafos: [
            "O processo tem duas etapas. Na primeira, seu currículo é analisado automaticamente e comparado com os requisitos da vaga. Se o resultado atingir a pontuação mínima definida pela empresa, você é convidado para a segunda etapa.",
            "A segunda etapa é uma entrevista por voz conduzida pela Iris, uma inteligência artificial. Você grava respostas em áudio para as perguntas apresentadas. Não há avaliador humano ao vivo durante a gravação.",
        ],
    },
    {
        titulo: "3. Dados que coletamos",
        paragrafos: [
            "Para a inscrição: nome completo, CPF (ou a indicação de que você não é brasileiro), e-mail, telefone, endereço do seu perfil no LinkedIn e o arquivo do seu currículo.",
            "Durante a entrevista: as gravações de áudio das suas respostas, a transcrição desses áudios e as métricas extraídas da sua fala, como clareza, fluência e ritmo.",
            "Se você optar por se declarar pessoa com deficiência: o tipo de deficiência e as adaptações que você descrever. Esse é um dado sensível pela LGPD, o preenchimento é totalmente voluntário e ele é usado com uma única finalidade — adaptar o processo para que você possa participar. Não entra na avaliação, e deixar em branco não prejudica sua candidatura em nada.",
            "Fora isso, não solicitamos dados sensíveis. Se você incluir no currículo informações que não deseja compartilhar — como estado de saúde, filiação sindical, religião ou opinião política —, recomendamos removê-las antes de anexar.",
        ],
    },
    {
        titulo: "4. Como usamos esses dados",
        paragrafos: [
            "Seus dados são usados para avaliar sua aderência à vaga e são compartilhados com a empresa responsável pela seleção, que é quem decide sobre a contratação.",
            "As gravações de áudio são processadas por serviços de inteligência artificial para transcrição e análise. Elas não são usadas para treinar modelos abertos nem repassadas a terceiros com finalidade comercial.",
        ],
    },
    {
        titulo: "5. Decisões automatizadas",
        paragrafos: [
            "Parte da avaliação é feita de forma automatizada, sem intervenção humana no momento da análise. Isso inclui a triagem do currículo e a pontuação atribuída às respostas da entrevista.",
            "Você tem direito a solicitar a revisão humana de qualquer decisão tomada apenas por meio automatizado, conforme o artigo 20 da Lei Geral de Proteção de Dados (Lei 13.709/2018). Basta pedir pelo canal de contato indicado ao final.",
        ],
    },
    {
        titulo: "6. Armazenamento e prazo",
        paragrafos: [
            "Seus dados ficam guardados enquanto o processo seletivo estiver em andamento e, depois dele, no banco de talentos da empresa, para que você possa ser considerado em oportunidades futuras.",
            "Você pode pedir a exclusão dos seus dados a qualquer momento. Feito o pedido, sua candidatura é encerrada e as informações são removidas, salvo o que a empresa precise manter por obrigação legal.",
        ],
    },
    {
        titulo: "7. Seus direitos",
        paragrafos: [
            "A LGPD garante a você, entre outros direitos: confirmar se tratamos seus dados, acessá-los, corrigir dados incompletos ou desatualizados, solicitar anonimização ou exclusão, saber com quem os compartilhamos e revogar o consentimento.",
            "O exercício de qualquer desses direitos é gratuito e não prejudica sua participação no processo.",
        ],
    },
    {
        titulo: "8. Contato",
        paragrafos: [
            "Dúvidas sobre estes termos ou pedidos relacionados aos seus dados devem ser enviados ao encarregado de dados da empresa responsável pela vaga, pelo canal informado na comunicação do processo seletivo.",
            "Ao marcar a caixa de aceite, você confirma que leu este documento por inteiro e concorda com as condições acima.",
        ],
    },
];
