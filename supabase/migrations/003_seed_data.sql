-- ============================================================
-- PharmaLab R&D Platform — Demo Seed Data
-- Run in: Supabase SQL Editor
-- Order: 003 (run after 001 + 002)
--
-- NOTE: created_by / researcher_id are intentionally NULL here.
-- After signing up, a lab_manager can run:
--   UPDATE public.experiments SET created_by = auth.uid() WHERE created_by IS NULL;
-- to claim ownership of seed experiments.
-- ============================================================

-- ── Experiments ───────────────────────────────────────────────────────────────
INSERT INTO public.experiments
  (id, name, category, phase, status, priority, researcher_name, tags, description, started_at, due_date, progress)
VALUES
  ('EXP-2045','Compound X-77 Cytotoxicity Assay','In Vitro','Phase II','In Progress','High','Dr. Rachel Kim',
   ARRAY['cytotoxicity','compound-X','cancer'],
   'Determine the IC50 of Compound X-77 against HeLa cells using an MTT assay. Primary endpoint: cell viability at 48h post-exposure.',
   '2026-02-10','2026-03-05',62),

  ('EXP-2044','Bioavailability Study – Oral Formulation','Pharmacokinetics','Phase III','In Progress','High','Dr. James Osei',
   ARRAY['PK','oral','bioavailability'],
   'Assess oral bioavailability of candidate compound in Sprague-Dawley rat model. Collect plasma samples at 0.25, 0.5, 1, 2, 4, 8, 24h.',
   '2026-02-08','2026-03-10',45),

  ('EXP-2041','mRNA Stability Analysis – Lot B','Molecular Biology','Phase III','Completed','Medium','Dr. James Osei',
   ARRAY['mRNA','stability','lot-B'],
   'Evaluate thermal and storage stability of mRNA Lot B under various buffer conditions and temperatures.',
   '2026-01-20','2026-02-20',100),

  ('EXP-2040','Receptor Binding Affinity – GPCR Panel','Biochemistry','Phase I','Completed','Medium','Dr. Sarah Chen',
   ARRAY['GPCR','binding','receptor'],
   'Screen compound library against a panel of 12 GPCR receptors using radioligand binding displacement assays.',
   '2026-01-15','2026-02-15',100),

  ('EXP-2039','Enzyme Kinetics: Inhibitor Screening','Biochemistry','Phase I','Pending Review','High','Dr. Sarah Chen',
   ARRAY['enzyme','kinetics','screening'],
   'Screen 48 candidate inhibitors against target protease. Determine Ki values for top hits using Michaelis-Menten kinetics.',
   '2026-01-28','2026-02-28',90),

  ('EXP-2037','HPLC Purity Testing – Batch 44','Analytical Chemistry','Phase II','In Progress','Low','Dr. Marcus Lee',
   ARRAY['HPLC','purity','batch-44'],
   'Assess chemical purity of Batch 44 API by reversed-phase HPLC. Target: >99.5% purity by area normalization.',
   '2026-02-12','2026-03-01',30),

  ('EXP-2034','Cell Viability – NP Formulation','In Vitro','Phase I','On Hold','Medium','Dr. Priya Mehta',
   ARRAY['cell-viability','nanoparticle'],
   'Evaluate cytotoxicity of nanoparticle formulation Trial 2 on HEK-293 and A549 cell lines.',
   '2026-02-01','2026-03-15',20),

  ('EXP-2031','Western Blot – Protein Expression Profile','Molecular Biology','Phase II','Completed','Low','Dr. Rachel Kim',
   ARRAY['western-blot','protein','expression'],
   'Characterize protein expression changes in treated vs. untreated cell lysates using Western blotting.',
   '2026-01-05','2026-02-05',100)
ON CONFLICT (id) DO NOTHING;

-- ── Lab Notes ─────────────────────────────────────────────────────────────────
INSERT INTO public.lab_notes
  (id, title, experiment_id, tags, content)
VALUES
  ('NB-2026-047','Compound X-77 – Day 3 Observation','EXP-2045',
   ARRAY['cytotoxicity','observation'],
   E'## Objective\nRecord Day 3 observations for Compound X-77 cytotoxicity assay.\n\n## Materials & Reagents\n- Compound X-77 (10 mM stock in DMSO)\n- HeLa cells (passage 12)\n- MTT reagent (Sigma M5655)\n\n## Procedure\n1. Added compound at 0.1, 1, 5, 10, 25, 50 μM\n2. Incubated 48h at 37°C, 5% CO₂\n3. Added MTT (5 mg/mL), 4h incubation\n4. Dissolved formazan in DMSO\n\n## Observations\nCell viability reduced to 42% at 10 μM concentration. IC50 value recalculated as 6.8 μM (±0.3). Controls within acceptable range. Morphological changes visible at 5 μM.\n\n## Results\n| Concentration (μM) | Viability (%) |\n|---|---|\n| 0.1 | 98.2 |\n| 1.0 | 87.4 |\n| 5.0 | 61.3 |\n| 10 | 42.1 |\n| 25 | 18.6 |\n| 50 | 5.3 |\n\n## Conclusions\nIC50 = 6.8 μM. Proceed to repeat with n=3 for statistical significance.'),

  ('NB-2026-046','mRNA Stability – Final Results Summary','EXP-2041',
   ARRAY['mRNA','stability','final'],
   E'## Objective\nDocument final stability results for mRNA Lot B across all buffer conditions.\n\n## Conditions Tested\n- 4°C / PBS buffer\n- -20°C / 10 mM Tris-HCl\n- -80°C / RNAlater stabilization solution\n\n## Results\n| Condition | t½ (h) | Integrity (RIN) |\n|---|---|---|\n| 4°C PBS | 4.2 | 4.1 |\n| -20°C Tris | 18.3 | 8.2 |\n| -80°C RNAlater | >72 | 9.6 |\n\n## Conclusions\nHalf-life at -20°C: 18.3h (±1.2h). Significant improvement over Lot A (11.7h). -80°C storage recommended for long-term stability.'),

  ('NB-2026-044','Inhibitor Screening – Dose Response','EXP-2039',
   ARRAY['enzyme','screening','dose-response'],
   E'## Objective\nDose-response characterisation of 12 candidate protease inhibitors.\n\n## Procedure\n1. Serial dilution: 0.1 – 100 μM (10-point curve)\n2. Pre-incubated enzyme + inhibitor 30 min at RT\n3. Added fluorogenic substrate, measured ΔF at 480/530 nm\n\n## Results\nScreened 12 candidate inhibitors at 5 concentrations (0.1 – 100 μM). Compounds 4, 7, and 11 showed >80% inhibition at 10 μM.\n\n| Compound | Ki (μM) | % Inhibition @10μM |\n|---|---|---|\n| Cpd-4 | 0.24 | 94% |\n| Cpd-7 | 0.61 | 88% |\n| Cpd-11 | 1.12 | 81% |\n\n## Conclusions\nCpd-4 selected as lead candidate. Advance to selectivity panel screening.'),

  ('NB-2026-042','HPLC Setup & Initial Chromatogram','EXP-2037',
   ARRAY['HPLC','analytical'],
   E'## Objective\nValidate HPLC method for Batch 44 API purity assessment.\n\n## Method Parameters\n- Column: C18 (250mm × 4.6mm, 5μm)\n- Mobile phase A: 0.1% TFA in H₂O\n- Mobile phase B: Acetonitrile\n- Gradient: 5→95% B over 20 min\n- Flow rate: 1.0 mL/min\n- Injection: 10 μL at 1 mg/mL\n- Detection: UV 254 nm\n\n## Observations\nMain peak at 14.3 min. Two minor impurities at 8.7 min (0.3%) and 17.1 min (0.2%). System suitability: tailing factor 1.08 (pass).\n\n## Conclusions\nMethod validated. Purity of Batch 44: 99.5%. Meets release specification.')
ON CONFLICT (id) DO NOTHING;

-- ── Samples ───────────────────────────────────────────────────────────────────
INSERT INTO public.samples
  (id, name, type, experiment_id, batch, volume, concentration, storage, location, status, expiry_month, received_at, quantity, max_quantity)
VALUES
  ('SMP-1192','Compound X-77 Solution','Small Molecule','EXP-2045','BATCH-044','50 mL','10 mM','-80°C Freezer','Rack A, Shelf 3','Active','Aug 2026','2026-02-10',12,20),
  ('SMP-1189','HeLa Cell Lysate – P3','Biological','EXP-2045','BATCH-042','200 μL','2 mg/mL','-20°C Freezer','Rack B, Shelf 1','Active','Apr 2026','2026-02-08',8,15),
  ('SMP-1185','mRNA Lot B – Purified','Nucleic Acid','EXP-2041','BATCH-039','1 mL','500 μg/mL','-80°C Freezer','Rack A, Shelf 1','Depleted','Mar 2026','2026-01-20',0,10),
  ('SMP-1180','Inhibitor Panel – Set C','Small Molecule','EXP-2039','BATCH-038','Various','100 mM stock','4°C Fridge','Rack C, Shelf 2','Active','Dec 2026','2026-01-28',15,16),
  ('SMP-1176','PBS Buffer 10x','Buffer',NULL,'BATCH-033','500 mL','10x','RT','Rack D, Shelf 4','Low Stock','Jan 2027','2026-01-05',3,20),
  ('SMP-1172','NP Formulation – Trial 2','Formulation','EXP-2034','BATCH-030','10 mL','5 mg/mL','4°C Fridge','Rack B, Shelf 3','Quarantine','May 2026','2026-02-01',5,10)
ON CONFLICT (id) DO NOTHING;

-- ── Protocols ─────────────────────────────────────────────────────────────────
INSERT INTO public.protocols
  (id, title, category, version, status, author_name, description, tags, usage_count, review_due)
VALUES
  ('SOP-PCR-007','PCR Amplification – Standard Protocol','Molecular Biology','v3.2','Approved','Dr. Rachel Kim',
   'Standard operating procedure for PCR amplification including primer design guidelines, thermocycler settings, and gel electrophoresis analysis.',
   ARRAY['PCR','amplification','molecular'],47,'2027-03-01'),

  ('SOP-CELL-012','Cell Culture & Maintenance','Cell Biology','v2.1','Approved','Dr. Priya Mehta',
   'Guidelines for maintaining mammalian cell lines including passaging, cryopreservation, mycoplasma testing, and contamination prevention.',
   ARRAY['cell-culture','maintenance','sterile'],89,'2027-01-15'),

  ('SOP-HPLC-003','HPLC Method Development & Validation','Analytical Chemistry','v4.0','Approved','Dr. Marcus Lee',
   'Comprehensive protocol for HPLC method development, system suitability testing, and validation according to ICH Q2(R1) guidelines.',
   ARRAY['HPLC','analytical','validation'],34,'2026-06-30'),

  ('SOP-SAFE-001','Chemical Safety & Hazardous Materials Handling','Safety','v5.1','Approved','Dr. James Osei',
   'Laboratory safety procedures for handling hazardous chemicals, biological agents, and radioactive materials. Mandatory annual review.',
   ARRAY['safety','chemicals','regulatory'],156,'2027-02-01'),

  ('SOP-DATA-005','Electronic Lab Notebook Guidelines','Data Management','v1.3','Under Review','Dr. Sarah Chen',
   'Best practices for maintaining electronic lab notebooks including data integrity, version control, and regulatory compliance for 21 CFR Part 11.',
   ARRAY['ELN','data','compliance'],23,'2026-04-15'),

  ('SOP-PKS-009','Pharmacokinetic Sampling Protocol','Pharmacokinetics','v2.0','Approved','Dr. James Osei',
   'Standard protocol for blood, plasma, and tissue collection in PK studies. Includes sample processing, storage, and stability requirements.',
   ARRAY['PK','sampling','in-vivo'],28,'2026-12-01'),

  ('SOP-ANAL-002','Western Blot Protocol','Analytical Chemistry','v1.0','Expired','Dr. Rachel Kim',
   'Deprecated protocol for Western blot analysis. Superseded by SOP-ANAL-008. Do not use for new experiments.',
   ARRAY['western-blot','protein','deprecated'],67,'2025-06-01')
ON CONFLICT (id) DO NOTHING;

-- ── Timeline events for demo experiments ─────────────────────────────────────
INSERT INTO public.experiment_timeline_events
  (experiment_id, title, description, event_type, event_date)
VALUES
  ('EXP-2045','Experiment initiated','Cells seeded and compound dilutions prepared.','milestone','2026-02-10T09:00:00Z'),
  ('EXP-2045','Day 1 dose administration','Compound X-77 added at target concentrations.','data_collection','2026-02-11T10:30:00Z'),
  ('EXP-2045','Day 3 viability measurement','MTT assay performed. IC50 = 6.8 μM.','analysis','2026-02-14T14:00:00Z'),
  ('EXP-2044','Animal cohort randomised','16 Sprague-Dawley rats divided into 4 groups.','milestone','2026-02-08T08:00:00Z'),
  ('EXP-2044','Dose administration — Day 1','Single oral gavage at 10 mg/kg.','data_collection','2026-02-09T09:15:00Z'),
  ('EXP-2041','Final gel electrophoresis complete','RIN values confirmed for all lots.','analysis','2026-02-18T16:00:00Z'),
  ('EXP-2041','Experiment completed','All stability time points collected and analysed.','status_change','2026-02-20T12:00:00Z')
ON CONFLICT DO NOTHING;
