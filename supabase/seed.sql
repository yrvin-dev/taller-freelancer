-- Seed SOLO para el entorno local (`supabase db reset`). Nunca se aplica en producción.
-- Usuario demo: demo@taller-freelancer.local / demo-local-2026 (solo existe en tu Docker).
-- Los 6 proyectos del export (03 §1: proyectos ficticios con "(F)"), con fechas
-- relativas a hoy. Sin credenciales: se cifran con CREDENTIALS_KEY (tanda de cifrado).

do $$
declare
  demo uuid := '11111111-1111-4111-8111-111111111111';
  p_agb uuid; p_agw uuid; p_dfl uuid; p_snd uuid; p_plv uuid; p_alq uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', demo, 'authenticated', 'authenticated',
    'demo@taller-freelancer.local', extensions.crypt('demo-local-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Usuario Demo"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), demo, demo::text,
          jsonb_build_object('sub', demo::text, 'email', 'demo@taller-freelancer.local'),
          'email', now(), now(), now());
  -- El perfil lo crea el trigger handle_new_user.

  insert into public.projects (owner_id, code, name, client, client_country, type, status, is_demo,
    description, stack_frontend, stack_hosting, cms, link_deploy, link_cms, link_panel, domain_pending, updated_at)
  values (demo, 'AGB-2026', 'Colegio Guillermo Brown', 'Colegio Guillermo Brown', 'Perú', 'institucional',
    'produccion', false,
    'Landing institucional (Conócenos, Propuesta, Niveles, Eventos y Contacto). Desde Sanity Studio el colegio edita el comunicado y los eventos de la home.',
    '{Astro,Tailwind,React}', '{Vercel}', 'Sanity', 'landing-colegio-agb.vercel.app',
    'landing-colegio-agb.vercel.app/sanity', 'vercel.com/dashboard', true, now() - interval '30 hours')
  returning id into p_agb;

  insert into public.projects (owner_id, code, name, client, type, status, description,
    stack_frontend, stack_hosting, cms, link_panel, domain_pending, updated_at)
  values (demo, 'AGW-2026', 'Landing de servicios', 'AgenciaWeb', 'landing', 'en_desarrollo',
    'Landing de servicios con contenido administrable desde Strapi. Front en Vercel y Strapi en Railway.',
    '{Astro,React,Tailwind}', '{Vercel,Railway}', 'Strapi 5', 'railway.app/dashboard', true,
    now() - interval '31 hours')
  returning id into p_agw;

  insert into public.projects (owner_id, code, name, client, client_country, type, status, description, updated_at)
  values (demo, 'DFL-2026', 'Dashboard freelance', 'Proyecto propio', 'Perú', 'dashboard', 'en_desarrollo',
    'Plataforma propia para administrar mis proyectos web por cliente.', now() - interval '32 hours')
  returning id into p_dfl;

  insert into public.projects (owner_id, code, name, client, client_contact, client_email, client_whatsapp,
    client_country, type, status, is_demo, description, delivery_date, stack_frontend, stack_backend,
    stack_db, stack_hosting, local_path, link_repo, link_deploy, link_design, link_panel,
    domain_name, domain_expires, hosting_expires, budget_pen, updated_at)
  values (demo, 'SND-2026', '(F) Sonrident · Control de citas', 'Clínica Dental Sonrident', 'Dra. Paola Ríos',
    'admin@sonrident.pe', '+51 954 228 017', 'Perú', 'webapp', 'en_desarrollo', true,
    'Sistema de reservas para la clínica dental Sonrident: agenda por odontólogo, historial y cobro en línea.',
    current_date + 46, '{Angular,Tailwind}', '{"Spring Boot","Spring Security + JWT","Spring Data JPA"}',
    '{PostgreSQL}', '{Railway,Vercel}', 'D:\Proyectos\clientes\sonrident-citas',
    'github.com/devfreelance/sonrident-citas', 'sonrident-citas.vercel.app', 'figma.com/design/sonrident-citas',
    'railway.app/dashboard', 'sonrident-citas.vercel.app', current_date + 23, current_date + 41, 9500,
    now() - interval '20 hours')
  returning id into p_snd;

  insert into public.projects (owner_id, code, name, client, client_contact, client_email, client_whatsapp,
    client_country, type, status, is_demo, description, delivery_date, stack_frontend, stack_backend,
    stack_db, stack_hosting, cms, local_path, link_repo, link_deploy, link_cms, link_design, link_panel,
    domain_name, domain_expires, hosting_expires, budget_pen, updated_at)
  values (demo, 'PLV-2026', '(F) Polera Studio · E-commerce', 'Polera Studio', 'Andrés Cárdenas',
    'andres@polerastudio.pe', '+51 933 410 776', 'Perú', 'ecommerce', 'revision', true,
    'Tienda de polos con zoom de producto, selector de tallas y colores, carrito persistente y checkout.',
    current_date + 7, '{Next.js,Tailwind,Motion,Lenis}', '{"Medusa v2","Culqi (módulo propio)"}',
    '{PostgreSQL,Redis}', '{Vercel,Railway,Cloudinary}', 'Medusa Admin', 'D:\Proyectos\clientes\polera-studio',
    'github.com/devfreelance/polera-studio', 'polerastudio.pe', 'admin.polerastudio.pe',
    'figma.com/design/polera-shop', 'railway.app/dashboard', 'polerastudio.pe', current_date + 128,
    current_date + 14, 7800, now() - interval '33 hours')
  returning id into p_plv;

  insert into public.projects (owner_id, code, name, client, client_country, type, status, is_demo,
    description, delivery_date, stack_frontend, stack_backend, stack_db, stack_hosting, local_path,
    link_repo, link_deploy, link_design, link_panel, domain_name, budget_pen, updated_at)
  values (demo, 'ALQ-2026', '(F) Alquila Ya · Marketplace', 'Proyecto de portafolio', 'Perú', 'webapp',
    'en_desarrollo', true,
    'Marketplace de alquileres con búsqueda por mapa y precio, chat y reserva de visitas.',
    current_date + 57, '{"Next.js 15",Tailwind,Mapbox}', '{NestJS,Prisma}', '{PostgreSQL,"Supabase Storage"}',
    '{Vercel,Render}', 'D:\Proyectos\portafolio\alquila-ya', 'github.com/devfreelance/alquila-ya',
    'alquila-ya.vercel.app', 'figma.com/design/alquila-ya', 'dashboard.render.com', 'alquila-ya.vercel.app',
    6000, now() - interval '60 hours')
  returning id into p_alq;

  insert into public.payments (project_id, owner_id, amount_pen, paid_on, concept) values
    (p_snd, demo, 3800, current_date - 30, 'Adelanto'),
    (p_plv, demo, 3900, current_date - 20, 'Adelanto 50%'),
    (p_alq, demo, 1500, current_date - 15, 'Adelanto');

  insert into public.notes (project_id, owner_id, kind, body, noted_on) values
    (p_agb, demo, 'cambio', 'Pasa a Producción: sitio en vivo en landing-colegio-agb.vercel.app. Pendiente: compra del dominio.', current_date),
    (p_agb, demo, 'nota', 'Desplegado en Vercel (landing-colegio-agb.vercel.app).', current_date - 2),
    (p_agw, demo, 'nota', 'Front desplegado en Vercel y Strapi 5 en Railway. Pendiente: compra del dominio.', current_date - 2),
    (p_dfl, demo, 'nota', 'Prototipo de diseño listo. Siguiente: definir stack.', current_date - 2),
    (p_snd, demo, 'cambio', 'Pasarela Culqi integrada en sandbox: cobro de la cita y webhook que confirma la reserva.', current_date - 1),
    (p_snd, demo, 'pedido', 'Recordatorio por WhatsApp 24 h antes de cada cita.', current_date - 15),
    (p_plv, demo, 'nota', 'Demo enviada al cliente. Imágenes servidas por Cloudinary en AVIF/WebP.', current_date - 2),
    (p_plv, demo, 'pedido', 'Galería de producto con zoom y vista 360 del polo.', current_date - 11),
    (p_alq, demo, 'cambio', 'Búsqueda por mapa con clusters y filtros por distrito, precio y tipo.', current_date - 3);

  -- Los pagos y notas "tocan" su proyecto (trigger touch_project). Se restaura el orden
  -- de "recientes" del export con el trigger de updated_at apagado solo aquí.
  alter table public.projects disable trigger projects_set_updated_at;
  -- Miniaturas: rutas estáticas de public/mock/thumbs (DFL no tiene, T09a).
  update public.projects p set updated_at = now() - v.ago, thumbnail_path = v.thumb
  from (values ('SND-2026', interval '20 hours', '/mock/thumbs/snd.webp'),
               ('AGB-2026', interval '30 hours', '/mock/thumbs/agb.webp'),
               ('AGW-2026', interval '31 hours', '/mock/thumbs/agw.webp'),
               ('DFL-2026', interval '32 hours', null),
               ('PLV-2026', interval '33 hours', '/mock/thumbs/plv.webp'),
               ('ALQ-2026', interval '60 hours', '/mock/thumbs/alq.webp')) as v(code, ago, thumb)
  where p.owner_id = demo and p.code = v.code;
  alter table public.projects enable trigger projects_set_updated_at;
end;
$$;
