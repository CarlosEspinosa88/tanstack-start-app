WITH sample_todos(title, done, days_ago) AS (
  VALUES
    ('Review the release checklist', TRUE, 0),
    ('Draft the product update', FALSE, 0),
    ('Fix the account settings form', FALSE, 1),
    ('Read through user feedback', TRUE, 1),
    ('Plan the next sprint', FALSE, 2),
    ('Update onboarding copy', FALSE, 2),
    ('Audit stale dependencies', TRUE, 3),
    ('Share weekly progress', TRUE, 3),
    ('Add keyboard shortcuts', FALSE, 4),
    ('Verify the mobile layout', FALSE, 5),
    ('Prepare the demo workspace', FALSE, 5),
    ('Document API changes', FALSE, 6)
)
SELECT
  'demo-todo-' || lpad(CAST(row_number() OVER (ORDER BY days_ago, title) AS VARCHAR), 2, '0') AS id,
  title,
  done,
  strftime(current_timestamp - days_ago * INTERVAL '1 day', '%Y-%m-%dT%H:%M:%SZ') AS "createdAt",
  'demo-user' AS "userId"
FROM sample_todos
ORDER BY days_ago, title;
