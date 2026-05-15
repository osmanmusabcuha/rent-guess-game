# Antigravity Bootstrap Context

Bu projede herhangi bir değişiklik yapmadan önce aşağıdaki dosyaları oku:

- agent-lite/PROJECT_CONTEXT.md
- agent-lite/UI_VISION.md
- agent-lite/CODING_RULES.md
- agent-lite/GAMEPLAY_RULES.md
- agent-lite/API_CONTRACTS.md
- agent-lite/CHANGE_WORKFLOW.md
- agent-lite/CHECKLIST.md

Bu dosyalar Rent Guess Game projesinin geliştirme kurallarıdır.

## Zorunlu Kurallar

- Çalışan sistemi bozma.
- Büyük refactor yapma.
- Backend API response şemalarını keyfi değiştirme.
- `/listings/random` endpointinden `rent` bilgisini frontend’e sızdırma.
- Local görsel yapısını koru: `backend/data/images/{ilan_id}/`
- Veri yapısını koru: `backend/data/details/`
- UI vizyonunu koru: dark, oyun hissi veren, progression bar odaklı yapı.
- Her değişiklikten sonra manuel test adımlarını yaz.

## Çalışma Şekli

Her görevde önce:
1. Hangi dosyaları değiştireceğini listele.
2. Neyin bozulma riski olduğunu yaz.
3. Minimum değişiklikle uygula.
4. Test adımlarını yaz.