-- Configurar REPLICA IDENTITY FULL para capturar todos os campos
ALTER TABLE public.video_calls REPLICA IDENTITY FULL;

-- Adicionar à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;