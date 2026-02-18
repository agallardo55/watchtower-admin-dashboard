-- Seed BITW card data into existing apps in wt_app_registry

UPDATE wt_app_registry SET
  overview = 'SalesboardHQ transforms the chaotic sales floor into a data-driven high-performance environment. Track every ''up'', monitor real-time deal progress, and visualize team goals on a sleek dashboard designed for modern dealerships.',
  target_users = ARRAY['Sales managers', 'General managers', 'Sales associates'],
  roadmap = '[{"text": "Live floor traffic tracking", "done": true}, {"text": "Individual commission calculators", "done": true}, {"text": "Leaderboard gamification", "done": true}]'::jsonb,
  app_url = 'https://salesboardhq.com'
WHERE name = 'SalesboardHQ';

UPDATE wt_app_registry SET
  overview = 'Most dealerships are invisible to AI search agents. DealerScore scans your website and generates a readiness report showing exactly what to fix so LLMs can find your inventory, pricing, and service center.',
  target_users = ARRAY['Dealer principals', 'Marketing managers', 'Website vendors'],
  roadmap = '[{"text": "Monthly monitoring alerts", "done": false}, {"text": "Competitor comparison", "done": false}, {"text": "Vendor report PDF export", "done": false}]'::jsonb,
  app_url = 'https://dealerscore.app'
WHERE name = 'DealerScore';

UPDATE wt_app_registry SET
  overview = 'Stop fighting for scraps at physical auctions. BuybidHQ connects elite dealers directly to high-margin inventory. List a vehicle, get competitive bids from verified buyers, and move wholesale inventory faster than ever.',
  target_users = ARRAY['Wholesale managers', 'Used car directors', 'Independent dealers'],
  roadmap = '[{"text": "Real-time bid notifications", "done": true}, {"text": "VIN decoder integration", "done": true}, {"text": "Mobile app", "done": false}]'::jsonb,
  app_url = 'https://buybidhq.com'
WHERE name = 'BuybidHQ';

UPDATE wt_app_registry SET
  overview = 'Demolight automates the coordination between sales staff and inventory lot managers to ensure every test drive is ready and waiting when the customer arrives.',
  target_users = ARRAY['Lot managers', 'Sales managers', 'Porters'],
  roadmap = '[{"text": "GPS lot tracking", "done": false}, {"text": "Customer check-in kiosk", "done": false}]'::jsonb,
  app_url = 'https://demolight.app'
WHERE name = 'Demolight';

UPDATE wt_app_registry SET
  overview = 'Combines AI coaching (Coach Miller), real-time commission tracking, voice follow-up calls, and multi-channel messaging into one tool. Chrome extension primary, web dashboard secondary.',
  target_users = ARRAY['Sales consultants', 'F&I managers', 'Sales trainers'],
  roadmap = '[{"text": "Chrome extension MVP", "done": false}, {"text": "Voice call integration", "done": false}]'::jsonb
WHERE name = 'Sidepilot';
