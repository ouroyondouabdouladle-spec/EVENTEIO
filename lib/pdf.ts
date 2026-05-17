import type { Event } from '@/types/database';

/**
 * Génère une fiche synthèse / contrat PDF premium pour un événement donné.
 * Ouvre une nouvelle fenêtre avec une mise en page soignée, formatée pour l'impression
 * et déclenche la boîte de dialogue d'impression système (Enregistrer sous PDF).
 */
export function generateEventPDF(event: Event) {
    if (typeof window === 'undefined') return;

    const clientNames = [
        event.client_monsieur_prenom ? `${event.client_monsieur_prenom} ${event.client_monsieur_nom}` : '',
        event.client_madame_prenom ? `${event.client_madame_prenom} ${event.client_madame_nom}` : ''
    ].filter(Boolean).join(' & ');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Veuillez autoriser les fenêtres contextuelles (popups) pour générer le PDF.");
        return;
    }

    const dateFormatted = event.date_start ? new Date(event.date_start).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) : 'Non définie';

    const montantRestant = (event.montant_total ?? 0) - (event.acompte ?? 0);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Synthèse Projet — ${event.title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                
                * {
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #0f172a;
                    background-color: #ffffff;
                    margin: 0;
                    padding: 40px;
                    line-height: 1.5;
                    font-size: 13px;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    color: #8b5cf6;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .doc-title {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #64748b;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 6px 12px;
                    border-radius: 9999px;
                }
                
                .main-title-block {
                    margin-bottom: 35px;
                }
                
                .event-title {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                    color: #0f172a;
                    letter-spacing: -0.03em;
                }
                
                .client-subtitle {
                    font-size: 16px;
                    font-weight: 600;
                    color: #8b5cf6;
                }
                
                .grid {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 30px;
                }
                
                .section {
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 20px;
                    padding: 24px;
                }
                
                .section-title {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: #8b5cf6;
                    margin-top: 0;
                    margin-bottom: 18px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 10px;
                }
                
                .data-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px dashed #e2e8f0;
                }
                
                .data-row:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                
                .label {
                    color: #64748b;
                    font-weight: 500;
                }
                
                .value {
                    color: #0f172a;
                    font-weight: 600;
                    text-align: right;
                }
                
                .highlight-value {
                    color: #8b5cf6;
                    font-weight: 700;
                }
                
                .full-width {
                    grid-column: 1 / -1;
                }
                
                .signature-area {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 30px;
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                
                .signature-box {
                    border: 1px dashed #cbd5e1;
                    border-radius: 20px;
                    padding: 24px;
                    min-height: 180px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background-color: #fafafa;
                }
                
                .signature-title {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #64748b;
                    margin-bottom: 6px;
                    letter-spacing: 0.08em;
                }
                
                .signature-client-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #334155;
                }
                
                .signature-img {
                    max-height: 90px;
                    max-width: 100%;
                    object-fit: contain;
                    align-self: center;
                    margin: 10px 0;
                }
                
                .signature-placeholder {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 12px;
                    text-align: center;
                    margin: auto;
                }
                
                .signature-date {
                    font-size: 9px;
                    font-weight: 500;
                    color: #94a3b8;
                    text-align: right;
                    margin-top: 6px;
                }
                
                .footer {
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    margin-top: 60px;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 25px;
                }
                
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">EVENTIO 📅</div>
                <div class="doc-title">Fiche Synthèse Projet</div>
            </div>

            <div class="main-title-block">
                <h1 class="event-title">${event.title}</h1>
                ${clientNames ? `<div class="client-subtitle">${clientNames}</div>` : ''}
            </div>

            <div class="grid">
                <!-- Général -->
                <div class="section">
                    <h3 class="section-title">Informations Générales</h3>
                    <div class="data-row">
                        <span class="label">Date de l'événement</span>
                        <span class="value">${dateFormatted}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Lieu</span>
                        <span class="value">${event.location ?? 'Non défini'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Prestation</span>
                        <span class="value">${event.type ?? 'Non défini'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Statut du Projet</span>
                        <span class="value" style="text-transform: capitalize;">${
                            event.status === 'valide' ? 'Validé' : 
                            event.status === 'en_attente' ? 'En attente' : 
                            event.status === 'termine' ? 'Terminé' : 'Brouillon'
                        }</span>
                    </div>
                </div>

                <!-- Finances -->
                <div class="section">
                    <h3 class="section-title">Synthèse Financière</h3>
                    <div class="data-row">
                        <span class="label">Montant Global H.T.</span>
                        <span class="value">${event.montant_total ? event.montant_total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Acompte Réglé</span>
                        <span class="value">${event.acompte ? event.acompte.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Solde Restant</span>
                        <span class="value highlight-value">${montantRestant ? montantRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Statut Paiement</span>
                        <span class="value" style="text-transform: capitalize;">${
                            event.statut_paiement === 'paye' ? 'Payé' : 
                            event.statut_paiement === 'acompte_recu' ? 'Acompte reçu' : 'Non payé'
                        }</span>
                    </div>
                </div>

                <!-- Monsieur -->
                <div class="section">
                    <h3 class="section-title">Client — Monsieur</h3>
                    <div class="data-row">
                        <span class="label">Nom complet</span>
                        <span class="value">${[event.client_monsieur_prenom, event.client_monsieur_nom].filter(Boolean).join(' ') || 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Téléphone</span>
                        <span class="value">${event.client_monsieur_tel ?? 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">E-mail</span>
                        <span class="value">${event.client_monsieur_email ?? 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Instagram</span>
                        <span class="value">${event.client_monsieur_instagram ? `@${event.client_monsieur_instagram.replace('@', '')}` : 'Non renseigné'}</span>
                    </div>
                </div>

                <!-- Madame -->
                <div class="section">
                    <h3 class="section-title">Client — Madame</h3>
                    <div class="data-row">
                        <span class="label">Nom complet</span>
                        <span class="value">${[event.client_madame_prenom, event.client_madame_nom].filter(Boolean).join(' ') || 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Téléphone</span>
                        <span class="value">${event.client_madame_tel ?? 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">E-mail</span>
                        <span class="value">${event.client_madame_email ?? 'Non renseigné'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Instagram</span>
                        <span class="value">${event.client_madame_instagram ? `@${event.client_madame_instagram.replace('@', '')}` : 'Non renseigné'}</span>
                    </div>
                </div>

                <!-- Notes Internes -->
                ${event.notes_internes ? `
                <div class="section full-width">
                    <h3 class="section-title">Notes & Remarques Internes</h3>
                    <div style="font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${event.notes_internes}</div>
                </div>
                ` : ''}

                <!-- Annulation -->
                ${event.conditions_annulation ? `
                <div class="section full-width">
                    <h3 class="section-title">Conditions d'Annulation & Mentions</h3>
                    <div style="font-size: 12px; color: #475569; white-space: pre-wrap; line-height: 1.6;">${event.conditions_annulation}</div>
                </div>
                ` : ''}
            </div>

            <!-- Signatures -->
            <div class="signature-area">
                <div class="signature-box">
                    <div>
                        <div class="signature-title">Signature — Monsieur</div>
                        <div class="signature-client-name">
                            ${[event.client_monsieur_prenom, event.client_monsieur_nom].filter(Boolean).join(' ') || 'Monsieur'}
                        </div>
                    </div>
                    ${event.signature_monsieur ? `
                        <img class="signature-img" src="${event.signature_monsieur}" alt="Signature Monsieur" />
                    ` : `
                        <div class="signature-placeholder">En attente de signature</div>
                    `}
                    ${event.signature_date && event.signature_monsieur ? `
                        <div class="signature-date">Signé électroniquement le ${new Date(event.signature_date).toLocaleDateString('fr-FR')}</div>
                    ` : ''}
                </div>

                <div class="signature-box">
                    <div>
                        <div class="signature-title">Signature — Madame</div>
                        <div class="signature-client-name">
                            ${[event.client_madame_prenom, event.client_madame_nom].filter(Boolean).join(' ') || 'Madame'}
                        </div>
                    </div>
                    ${event.signature_madame ? `
                        <img class="signature-img" src="${event.signature_madame}" alt="Signature Madame" />
                    ` : `
                        <div class="signature-placeholder">En attente de signature</div>
                    `}
                    ${event.signature_date && event.signature_madame ? `
                        <div class="signature-date">Signé électroniquement le ${new Date(event.signature_date).toLocaleDateString('fr-FR')}</div>
                    ` : ''}
                </div>
            </div>

            <div class="footer">
                Document généré et édité électroniquement par la plateforme EVENTIO. Tous droits réservés.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
