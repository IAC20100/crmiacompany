import html2pdf from 'html2pdf.js';

export async function generatePdf(element: HTMLElement, fileName: string) {
  try {
    console.log('Iniciando geração de PDF (Motor: html2pdf.js) para:', fileName);
    
    // Garantir que as imagens estão carregadas
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    // Pequeno delay para estabilização
    await new Promise(resolve => setTimeout(resolve, 800));

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Tentar forçar a remoção de oklch se ele ainda estiver presente
        onclone: (clonedDoc: Document) => {
          // Remover QUALQUER tag de estilo que possa conter oklch e substituir por cores seguras
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            let css = styles[i].innerHTML;
            if (css.includes('oklch')) {
              // Substituição agressiva de oklch por cores hex aproximadas
              css = css.replace(/oklch\([^)]+\)/g, '#71717a');
              styles[i].innerHTML = css;
            }
          }
          
          // Limpar estilos inline em todos os elementos
          const all = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < all.length; i++) {
            const el = all[i] as HTMLElement;
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && inlineStyle.includes('oklch')) {
              el.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, '#71717a'));
            }
            
            // Forçar background branco e texto preto se necessário para garantir contraste
            if (el.classList.contains('bg-white')) el.style.backgroundColor = '#ffffff';
            if (el.classList.contains('text-zinc-900')) el.style.color = '#18181b';
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Gerar e baixar
    console.log('Renderizando documento...');
    await html2pdf().set(opt).from(element).save();
    
    console.log('PDF gerado e download iniciado');
    return true;
  } catch (error) {
    console.error('Erro crítico no motor html2pdf:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha na geração do PDF');
  }
}
