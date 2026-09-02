-- ============================================================================
-- SKKN AI SEED DATA (PHASE 0)
-- ============================================================================

-- Seed Prompt Versions for Phase 0 Verification
INSERT INTO public.prompt_versions (prompt_key, version, system_prompt, user_template, is_active)
VALUES
(
  'skkn-classifier',
  '1.0.0',
  'Bạn là chuyên gia phân loại hồ sơ sư phạm Sáng kiến kinh nghiệm. Hãy phân loại đối tượng, cấp học và chuyên môn.',
  'Dữ liệu đầu vào: {{input_text}}',
  TRUE
),
(
  'skkn-extractor',
  '1.0.0',
  'Bạn là trợ lý trích xuất thực trạng và số liệu thực nghiệm cho SKKN.',
  'Nội dung cần trích xuất: {{input_text}}',
  TRUE
),
(
  'skkn-writer',
  '1.0.0',
  'Bạn là trợ lý sư phạm soạn thảo Sáng kiến kinh nghiệm chuẩn Bộ GD&ĐT GDPT 2018.',
  'Yêu cầu soạn thảo phần {{section_key}} với các sự kiện: {{facts}}',
  TRUE
),
(
  'skkn-reviewer',
  '1.0.0',
  'Bạn là Giám khảo Hội đồng chấm SKKN. Hãy đánh giá theo 4 tiêu chí chuẩn mực.',
  'Bản thảo cần đánh giá: {{draft_content}}',
  TRUE
)
ON CONFLICT (prompt_key, version) DO NOTHING;
