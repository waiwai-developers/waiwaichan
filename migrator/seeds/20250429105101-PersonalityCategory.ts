import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigratePersonalityCategoryModel } from "./models/MigratePersonalityCategoryModel";
export const ITEM_RECORDS = [
	{
		id: 1,
		personalityId: 1,
		name: "カテゴリなし",
		context: JSON.parse(`
{
	"input_scope": {}
}
		`),
	},
	{
		id: 2,
		personalityId: 1,
		name: "ライティング",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「ライティングに関するカテゴリ」に属する質問を前提に回答してください。",
		"writing_knowledge_domains": {
			"writing_fundamentals": [
				"論理的構成法（PREP法, SDS法, 三段論法）",
				"読点・句読点・接続詞の使い方",
				"語彙選択（専門語 / 一般語 / 読者リテラシー適合）",
				"文体トーンのコントロール（敬語・フレンドリー・硬質 etc.）",
				"可読性設計（一文の長さ / 漢字率 / 読点最適化）"
			],
			"web_and_ux_writing": [
				"マイクロコピー設計（ボタン, エラーメッセージ, フォームラベル）",
				"UXライティングの原則（明確・簡潔・共感）",
				"多言語対応と翻訳考慮（i18n対応）",
				"コンバージョンライティング（CTA最適化）",
				"空間との調和（レイアウト × テキスト）"
			],
			"content_strategy": [
				"コンテンツ設計（トピッククラスタ / コンテンツカレンダー）",
				"ペルソナベースの言語設計",
				"ストーリーテリング技法（起承転結 / ヒーローズジャーニー）",
				"長文・短文コンテンツの使い分け",
				"タイトル / 見出し設計（読了率・離脱率に基づく）"
			],
			"seo_and_discoverability": [
				"SEOライティング（キーワード自然挿入 / LSI）",
				"構造化マークアップ（<h1>, <meta>, schema.org 対応）",
				"スニペット最適化（meta description・OGP設計）",
				"検索意図マッチングと競合調査",
				"SERP最適化（FAQ, How-to schema, リッチリザルト）"
			],
			"editorial_and_review": [
				"編集プロセス（校正・推敲・フィードバックループ）",
				"スタイルガイドの作成と遵守",
				"誤字脱字・事実誤認のチェックフロー",
				"AI支援ツールの活用（Grammarly, ChatGPT, Claudeなど）",
				"チームによるピアレビューと承認ワークフロー"
			],
			"writing_for_special_formats": [
				"SNSライティング（140文字制限下の表現技術）",
				"メール・DMライティング（件名最適化、開封率向上）",
				"スクリプトライティング（YouTube / Podcast 等）",
				"テクニカルライティング（APIドキュメント, マニュアル等）",
				"ジャーナリズムライティング（5W1Hと構成バランス）"
			]
		}
	}
}
		`),
	},
	{
		id: 3,
		personalityId: 1,
		name: "マーケティング",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「マーケティングに関するカテゴリ」に属する質問を前提に回答してください。",
		"marketing_knowledge_domains": {
			"digital_marketing": [
				"オムニチャネル戦略（オンライン＋オフライン統合）",
				"コンテンツマーケティング（ブログ・動画・ホワイトペーパー等）",
				"カスタマージャーニー設計（AIDMA, AISAS, See-Think-Do-Care）",
				"Eメールマーケティング（配信設計 / パーソナライズ）",
				"CRM / MAツール活用（Salesforce, Hubspot, Marketo 等）"
			],
			"seo_and_search": [
				"オンページSEO（title, meta, h1構造, 内部リンク）",
				"テクニカルSEO（クローラビリティ / インデックス最適化）",
				"キーワードリサーチと検索意図分析（Search Intent）",
				"被リンク（バックリンク）戦略とE-A-T指針",
				"Core Web Vitals最適化（LCP, FID, CLS）"
			],
			"advertising_and_campaign": [
				"広告チャネル：Google広告 / Meta広告 / X広告",
				"リターゲティング / コンバージョン最適化（CRO）",
				"広告コピーとバナーABテスト",
				"UTMパラメータ設計とトラッキング",
				"広告運用KPI：CTR / CPC / CPA / ROAS"
			],
			"analytics_and_measurement": [
				"Google Analytics（GA4）",
				"ヒートマップ解析（Hotjar, Clarity）",
				"ファネル分析（アトリビューション / 離脱率）",
				"BIツール活用（Tableau, Looker, Google Data Studio）",
				"KPI設計とダッシュボード構築"
			],
			"branding_and_communication": [
				"ポジショニング戦略（STP分析）",
				"ペルソナ設計とブランドパーソナリティ",
				"トーン＆ボイス（言葉遣い・感情設計）",
				"SNSマーケティング（UGC / インフルエンサーマーケティング）",
				"コミュニケーションチャネル戦略（LINE / Discord / Slack 等）"
			],
			"growth_and_retention": [
				"グロースハック戦略（AARRRフレームワーク）",
				"エンゲージメント設計（Push通知 / メール / Loyalty設計）",
				"LTV最大化戦略（解約防止・再訪促進）",
				"ABテストと多変量テスト（MVT）",
				"プロダクト分析連携（Amplitude, Mixpanel）"
			]
		}
	}
}
		`),
	},
	{
		id: 4,
		personalityId: 1,
		name: "プロダクトマネージメント",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「プロダクトマネージメントに関するカテゴリ」に属する質問を前提に回答してください。",
		"product_management_knowledge_domains": {
			"product_strategy": [
				"プロダクトビジョンとミッションの策定",
				"プロダクトポートフォリオ戦略（BCGマトリクス等）",
				"北極星指標（North Star Metric）設計",
				"TAM/SAM/SOM分析による市場機会評価",
				"競合分析（SWOT / 5 Forces / ポジショニングマップ）"
			],
			"user_and_market_research": [
				"ユーザーインタビュー / サーベイ設計",
				"ユーザージャーニー / カスタマーマップ作成",
				"ペルソナ設計（行動・動機・背景分析）",
				"市場調査（定量・定性リサーチ）",
				"JTBD（Jobs To Be Done）によるニーズ抽出"
			],
			"roadmap_and_prioritization": [
				"プロダクトロードマップ策定（Now / Next / Later モデル）",
				"優先順位付け手法（RICE / MoSCoW / Kanoモデル）",
				"エピックとユーザーストーリーの整理",
				"OKR / KPI連動型の施策設計",
				"ステークホルダーとの調整・合意形成"
			],
			"execution_and_delivery": [
				"アジャイル開発（Scrum, Kanban）",
				"スプリント計画とレビュー",
				"チケット管理（Jira, Linear 等）",
				"リリース管理とフィードバックループ",
				"バックログ管理とデグレード対応"
			],
			"data_driven_decision_making": [
				"指標設計（KPI / KGI / OMTM）",
				"イベント設計とログ設計（GA4, Amplitude, Mixpanel）",
				"ABテスト設計と統計的有意性判断",
				"ユーザー行動分析とファネル分析",
				"データ可視化とダッシュボード運用"
			],
			"stakeholder_and_team_collaboration": [
				"エンジニア / デザイナーとの要件すり合わせ",
				"経営層へのレポーティング / プレゼン",
				"利害関係者マネジメント（内部・外部）",
				"チームビルディングと心理的安全性",
				"ワークショップファシリテーション（デザインスプリント等）"
			]
		}
	}
}
		`),
	},
	{
		id: 5,
		personalityId: 1,
		name: "webデザイン",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「webデザインに関するカテゴリ」に属する質問を前提に回答してください。",
		"web_design_knowledge_domains": {
			"visual_design": [
				"カラースキームと配色理論（色相環、補色、トライアド等）",
				"タイポグラフィ設計（フォント分類、階層、可読性）",
				"ホワイトスペースとレイアウトグリッド（黄金比 / 12列グリッド）",
				"UIアイコンとビジュアル要素の一貫性",
				"ダークモードデザインのベストプラクティス"
			],
			"user_experience": [
				"UX原則（ヒューリスティック評価、ユーザビリティ10原則）",
				"情報アーキテクチャ（カードソーティング / ナビゲーション設計）",
				"ペルソナとユーザーストーリーマッピング",
				"マイクロインタラクション設計（hover, loading, success feedback）",
				"認知心理学的デザイン（ヒックスの法則 / ミラーの法則）"
			],
			"branding_and_identity": [
				"ロゴ設計とFavicon体系",
				"トーン＆マナー（ビジュアルブランドガイド）",
				"コンテンツ戦略とスタイルガイド整備",
				"一貫したビジュアル言語（Design Tokens活用）"
			],
			"ui_components_and_patterns": [
				"デザインパターン（Accordion, Modal, Tabs, Carousel）",
				"コンポーネントライブラリ設計（Figma, Storybook連携）",
				"UI状態の視覚設計（Disabled, Hover, Error等）",
				"フォームUIのアクセシビリティ設計（Field validation, Placeholder）"
			],
			"prototyping_and_tools": [
				"デザインツール：Figma / Adobe XD / Sketch",
				"ワイヤーフレームとプロトタイピング（Low-fi / Hi-fi）",
				"コンポーネント化とAuto Layout（Figmaベース設計）",
				"ユーザーテストとA/Bテスト"
			],
			"responsive_and_device_design": [
				"デバイス別最適化（モバイル, タブレット, デスクトップ）",
				"タッチUI / モバイルファースト考慮",
				"Retinaディスプレイ対応とSVG活用",
				"スクロールやタップのUX考慮（タッチ領域・可視フィードバック）"
			]
		}
	}
}
		`),
	},
	{
		id: 6,
		personalityId: 1,
		name: "マークアップ",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「マークアップに関するカテゴリ」に属する質問を前提に回答してください。",
		"markup_knowledge_domains": {
			"html_core": [
				"HTML5 セマンティックタグ",
				"グローバル属性（lang, id, class, aria-* 等）",
				"入力フォーム（<input>, <form>, <fieldset>）",
				"メディア要素（<img>, <video>, <audio>, <source>）",
				"リンクとナビゲーション（<a>, <nav>, rel 属性）"
			],
			"css_core": [
				"CSS Box Model（margin, padding, border）",
				"レイアウト：Flexbox / CSS Grid",
				"ポジショニング（absolute, relative, fixed, sticky）",
				"Pseudo-classes / Pseudo-elements（:hover, ::before など）",
				"CSS 変数（Custom Properties）"
			],
			"responsive_design": [
				"メディアクエリ（@media）",
				"モバイルファースト設計（min-width 戦略）",
				"fluid grid / fit-content / clamp() 設計",
				"ビューポート制御（meta viewport）"
			],
			"accessibility": [
				"ARIA属性（aria-label, aria-live, role など）",
				"キーボードナビゲーション",
				"対応スクリーンリーダー考慮設計",
				"コントラスト・フォントサイズ指針（WCAG）"
			],
			"semantics_and_structure": [
				"HTML構造設計（<header>, <main>, <footer>, <article>, <section>）",
				"読みやすいHead構成（SEOタグ・favicon・meta各種）",
				"構造的な見出し階層（h1〜h6 の適切な配置）",
				"テーブル設計（caption, th, scope 属性対応）"
			],
			"motion_and_transitions": [
				"CSS アニメーション（@keyframes）",
				"CSS Transitions（transition-delay, timing-function）",
				"JavaScript APIによる動的class操作と連携（IntersectionObserver 活用 etc.）",
				"prefers-reduced-motion 対応によるユーザー設定尊重"
			]
		}
	}
}
		`),
	},
	{
		id: 7,
		personalityId: 1,
		name: "フロントエンド",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「フロントエンドに関するカテゴリ」に属する質問を前提に回答してください。",
		"frontend_knowledge_domains": {
			"markup_and_styling": [
				"HTML5（セマンティクス / SEO対応）",
				"CSS3（Box Model / Flex / Grid）",
				"CSS設計（BEM / OOCSS / SMACSS / Atomic Design）",
				"CSS-in-JS（styled-components / Emotion）",
				"Utility-First CSS（Tailwind CSS / UnoCSS）",
				"PostCSS / SCSS"
			],
			"uiux_design": [
				"デザインシステム（Storybook / Figma連携）",
				"コンポーネント設計（再利用性 / 状態管理分離）",
				"アクセシビリティ（WCAG / ARIA）",
				"レスポンシブデザイン（モバイルファースト / メディアクエリ）",
				"アニメーション & トランジション（CSS / Motionライブラリ）",
				"多言語対応（i18n / l10n戦略）"
			],
			"frameworks_and_libraries": [
				"React（Hooks / Suspense / Concurrent）",
				"Vue.js（Composition API / Pinia）",
				"Next.js / Nuxt.js（SSG / ISR / Middleware）",
				"状態管理（Redux Toolkit / Recoil / Jotai / Zustand）",
				"UIライブラリ（MUI / Chakra / Radix UI / shadcn/ui）",
				"React Server Components / Islands Architecture"
			],
			"runtime_and_browser": [
				"DOM / BOM 基礎",
				"イベントモデル / イベントバブリング",
				"非同期処理（Promise / async-await / fetch）",
				"Web APIs（IntersectionObserver / Clipboard / Storage）",
				"Web Workers / Service Worker / PWA（オフライン対応）"
			],
			"performance_and_optimization": [
				"パフォーマンス測定（Lighthouse / Web Vitals）",
				"Code Splitting / Lazy Loading / Dynamic Import",
				"Critical Rendering Path最適化",
				"prefetch / preload / defer戦略",
				"Hydration戦略（Partial / Streaming）"
			],
			"security": [
				"XSS / CSRF 対策",
				"コンテンツセキュリティポリシー（CSP）",
				"CORS / SameSite Cookie",
				"フロントエンドからの秘密情報保護"
			],
			"build_and_tooling": [
				"モジュールバンドラ（Webpack / Vite / esbuild）",
				"コンパイラとトランスパイラ（Babel / TypeScript）",
				"Linter / Formatter（ESLint / Prettier）",
				"モノレポ構成（Turborepo / Nx）",
				"CI/CDパイプライン連携（GitHub Actions / Vercel / Netlify）"
			],
			"testing": [
				"ユニットテスト（Jest / Vitest）",
				"コンポーネントテスト（React Testing Library / Vue Test Utils）",
				"E2Eテスト（Cypress / Playwright）",
				"モック戦略（Mock Service Worker / MirageJS）",
				"Visual Regression Testing（Percy / Chromatic）"
			]
		}
	}
}
		`),
	},
	{
		id: 8,
		personalityId: 1,
		name: "バックエンド",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「バックエンドに関するカテゴリ」に属する質問を前提に回答してください。",
		"backend_knowledge_domains": {
			"programming_languages": [
				"JavaScript / TypeScript（Node.js + Deno）",
				"Go（標準ライブラリ + Gin / Echo）",
				"Python（Flask / FastAPI / Django）",
				"Java / Kotlin（Spring Boot / Ktor）",
				"Rust（Actix / Axum）"
			],
			"language_theory": [
				"型システム（静的 / 動的型付け、構造的部分型）",
				"並行処理モデル（goroutine, thread, green thread, actor model）",
				"非同期プログラミング（Promise, async/await, Future）",
				"ガーベジコレクションとメモリ管理最適化",
				"実行モデル（イベントループ / スレッドプール / エンジン最適化）"
			],
			"application_architecture": [
				"クリーンアーキテクチャ / Onion Architecture",
				"DDD（ドメイン駆動設計）",
				"マイクロサービス / サーバレスアーキテクチャ",
				"MVC / MVVM / CQRS",
				"BFF（Backend For Frontend）",
				"Event-driven Architecture（EDA）"
			],
			"api_design": [
				"RESTful API（URI設計 / ステータスコード / OpenAPI）",
				"GraphQL（Schema-first / Code-first, Federation）",
				"gRPC / Protocol Buffers（IDL設計と双方向通信）",
				"WebSocket / SSE / HTTP/2 & HTTP/3",
				"API Gateway設計（認証・認可・スロットリング）"
			],
			"database": {
				"relational": [
					"PostgreSQL（拡張機能：PostGIS / JSONB）",
					"MySQL / MariaDB（InnoDB, MyRocks）",
					"SQL Server / Oracle（業務要件次第）"
				],
				"nosql": [
					"Redis（Pub/Sub, Stream）",
					"MongoDB（Aggregation Pipeline, Sharding）",
					"DynamoDB（Partition Key設計）",
					"Cassandra / ScyllaDB（高スループットNoSQL）"
				],
				"modeling": [
					"正規化 / 非正規化（第1〜第5正規形）",
					"データ構造選定（Array / JSON / Key-Value / Document）",
					"インデックス設計（B+ Tree, Hash Index, GIN/GiST）",
					"トランザクション制御（ACID, Isolation Level, Lock）",
					"分散トランザクション（2PC / SAGA パターン）"
				]
			},
			"testing": {
				"unit_and_integration": [
					"Jest / Mocha / Chai（JS系）",
					"Pytest / unittest（Python）",
					"JUnit / TestNG / Kotest（JVM）",
					"Supertest / MSW / HTTPX"
				],
				"contract_testing": [
					"Pact（Consumer-Driven Contract）",
					"OpenAPI Mock Server"
				],
				"mocking_and_tools": [
					"Sinon / Testdouble / Mock Service Worker",
					"Testcontainers（DB / Kafka / Redis などの実環境モック）",
					"Faker / FactoryBot / randomgen"
				]
			},
			"performance_and_scalability": [
				"キャッシュ戦略（Redis, CDN, メモリキャッシュ）",
				"Connection Pool / Circuit Breaker",
				"非同期キュー（RabbitMQ / Kafka / SQS）",
				"分散処理基盤（Celery / Sidekiq / Resque）",
				"水平スケーリング / シャーディング / レプリケーション"
			],
			"security": [
				"認証（JWT / OAuth2 / OIDC / Magic Link）",
				"認可（RBAC / ABAC / Scope設計）",
				"セキュア通信（HTTPS, HSTS, TLS設定）",
				"入力バリデーション / エスケープ処理",
				"OWASP Top 10 対策（XSS, SQLi, SSRF等）",
				"Secrets管理（HashiCorp Vault / AWS Secrets Manager）"
			]
		}
	}
}
		`),
	},
	{
		id: 9,
		personalityId: 1,
		name: "インフラストラクチャ",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「インフラストラクチャに関するカテゴリ」に属する質問を前提に回答してください。",
		"infrastructure_knowledge_domains": {
			"cloud_infrastructure": [
				"AWS（EC2 / S3 / VPC / IAM / ECS / RDS / CloudFront）",
				"GCP（Compute Engine / GKE / CloudRun / BigQuery / IAM）",
				"Azure（VM / App Service / AKS / Azure AD / Cosmos DB）",
				"ハイブリッド / マルチクラウド設計",
				"Infrastructure as Code（IaC）思想"
			],
			"containerization_and_orchestration": [
				"Docker（ビルド・レイヤー・マルチステージ）",
				"Docker Compose / BuildKit / Container Security",
				"Kubernetes（Pod / Deployment / Service / Volume / ConfigMap / Secret）",
				"Helm / Kustomize / Argo CD（K8sマニフェスト管理）",
				"Service Mesh（Istio / Linkerd / Envoy）"
			],
			"iac_and_provisioning": [
				"Terraform（モジュール / ワークスペース / State管理）",
				"CloudFormation（テンプレート / StackSets / Drift検知）",
				"Pulumi（コードベースIaC）",
				"Ansible / Chef（構成管理）",
				"CI連携とSecret管理（OpenID Connect / SOPS）"
			],
			"deployment_and_gitops": [
				"CI/CD：GitHub Actions / CircleCI / GitLab CI",
				"GitOps戦略（Argo CD / Flux / Argo Rollouts）",
				"Blue-Green / Canary / Shadow Release",
				"フィーチャーフラグ（LaunchDarkly 等）",
				"Artifact管理（Docker Registry / S3 / Nexus）"
			],
			"observability_and_monitoring": [
				"ロギング（Fluent Bit / Loki / CloudWatch / GCP Logging）",
				"メトリクス（Prometheus / Grafana / Datadog / Cloud Monitoring）",
				"トレース（OpenTelemetry / Jaeger / Zipkin / X-Ray）",
				"アラートルール / SLO / SLI 設計",
				"分散トレーシングとトラブルシュートパターン"
			],
			"networking_and_security": [
				"VPC / Subnet / NACL / Security Group",
				"DNS（Route53 / Cloud DNS / internal DNS）",
				"CDN（CloudFront / Cloudflare / Fastly）",
				"Load Balancer（ALB / NLB / GCLB）",
				"IAM（RBAC / ABAC / 最小権限設計）",
				"秘密情報管理（Secrets Manager / Vault）",
				"TLS / WAF / Shield / CSP / ファイアウォール"
			],
			"reliability_and_operations": [
				"SRE原則（SLO / SLI / エラーバジェット）",
				"障害対応プロセス（Incident Management / RCA）",
				"冗長構成 / フェイルオーバー設計",
				"バックアップ / リストア戦略（RTO / RPO）",
				"Chaos Engineering（Gremlin / Litmus）"
			],
			"edge_and_serverless": [
				"CDN Edge Function（Lambda@Edge / Cloudflare Workers）",
				"Serverless（AWS Lambda / GCP Cloud Functions / Azure Functions）",
				"イベント駆動（EventBridge / PubSub / SNS / SQS）",
				"Function-as-a-Service（FaaS）アーキテクチャ設計"
			]
		}
	}
}
		`),
	},
	{
		id: 10,
		personalityId: 1,
		name: "経営",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「経営に関するカテゴリ」に属する質問を前提に回答してください。",
		"business_management_knowledge_domains": {
			"corporate_strategy": [
				"企業ビジョン / ミッション / バリュー策定",
				"競争戦略（ポーターの5フォース / 差別化・コストリーダー戦略）",
				"グローバル戦略 / 多角化戦略（GEマトリクス, アンゾフの成長マトリクス）",
				"M&A戦略 / PMI（Post Merger Integration）",
				"サステナビリティ・ESG経営（CSR・SDGsとの整合）"
			],
			"organizational_design": [
				"組織構造設計（職能別 / 事業部制 / マトリクス組織）",
				"権限委譲と意思決定フロー設計（RACI / RAPID）",
				"組織文化と心理的安全性の構築",
				"報酬制度 / 評価制度設計（OKR / MBO / 360度評価）",
				"ダイバーシティ & インクルージョン施策"
			],
			"financial_management": [
				"損益計算書 / 貸借対照表 / キャッシュフロー分析",
				"財務指標（ROE / ROA / EBITDA / CCC など）",
				"予算策定と資金繰り計画",
				"資本政策（株式 / 負債 / バリュエーション）",
				"原価管理 / 固定費・変動費コントロール"
			],
			"marketing_and_growth": [
				"4P / STP / ポジショニング戦略",
				"カスタマージャーニー設計 / ブランド体験戦略",
				"リテンション・LTV最適化",
				"グロース戦略（AARRRモデル / CAC-LTV管理）",
				"リード獲得 / パイプラインマネジメント（B2B / B2C）"
			],
			"operations_and_execution": [
				"バリューチェーン分析（Porter）",
				"SCM（サプライチェーンマネジメント）",
				"業務改善 / BPR（業務プロセス再設計）",
				"KPIダッシュボードとPDCA運用",
				"リーン / シックスシグマ / TOC"
			],
			"risk_and_governance": [
				"コーポレートガバナンス（取締役会 / 内部監査）",
				"法務・コンプライアンス（労働法 / 個人情報保護 / 独禁法）",
				"リスクマネジメント（定量 / 定性評価）",
				"BCP（事業継続計画） / 危機管理計画",
				"情報セキュリティガバナンス（ISMS / SOC 2）"
			],
			"leadership_and_change": [
				"リーダーシップ理論（トランスフォーマティブ / サーバント等）",
				"組織変革（Change Management / Kotterモデル）",
				"社内コミュニケーション / 1on1 / 評価面談設計",
				"エンゲージメント向上施策",
				"経営者とミドルマネジメントの役割分担"
			]
		}
	}
}
		`),
	},
	{
		id: 11,
		personalityId: 1,
		name: "経理",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「経理に関するカテゴリ」に属する質問を前提に回答してください。",
		"business_management_knowledge_domains": {
			"corporate_strategy": [
				"企業ビジョン / ミッション / バリュー策定",
				"競争戦略（ポーターの5フォース / 差別化・コストリーダー戦略）",
				"グローバル戦略 / 多角化戦略（GEマトリクス, アンゾフの成長マトリクス）",
				"M&A戦略 / PMI（Post Merger Integration）",
				"サステナビリティ・ESG経営（CSR・SDGsとの整合）"
			],
			"organizational_design": [
				"組織構造設計（職能別 / 事業部制 / マトリクス組織）",
				"権限委譲と意思決定フロー設計（RACI / RAPID）",
				"組織文化と心理的安全性の構築",
				"報酬制度 / 評価制度設計（OKR / MBO / 360度評価）",
				"ダイバーシティ & インクルージョン施策"
			],
			"financial_management": [
				"損益計算書 / 貸借対照表 / キャッシュフロー分析",
				"財務指標（ROE / ROA / EBITDA / CCC など）",
				"予算策定と資金繰り計画",
				"資本政策（株式 / 負債 / バリュエーション）",
				"原価管理 / 固定費・変動費コントロール"
			],
			"marketing_and_growth": [
				"4P / STP / ポジショニング戦略",
				"カスタマージャーニー設計 / ブランド体験戦略",
				"リテンション・LTV最適化",
				"グロース戦略（AARRRモデル / CAC-LTV管理）",
				"リード獲得 / パイプラインマネジメント（B2B / B2C）"
			],
			"operations_and_execution": [
				"バリューチェーン分析（Porter）",
				"SCM（サプライチェーンマネジメント）",
				"業務改善 / BPR（業務プロセス再設計）",
				"KPIダッシュボードとPDCA運用",
				"リーン / シックスシグマ / TOC"
			],
			"risk_and_governance": [
				"コーポレートガバナンス（取締役会 / 内部監査）",
				"法務・コンプライアンス（労働法 / 個人情報保護 / 独占禁止法）",
				"リスクマネジメント（定量 / 定性評価）",
				"BCP（事業継続計画） / 危機管理計画",
				"情報セキュリティガバナンス（ISMS / SOC 2）"
			],
			"leadership_and_change": [
				"リーダーシップ理論（トランスフォーマティブ / サーバント等）",
				"組織変革（Change Management / Kotterモデル）",
				"社内コミュニケーション / 1on1 / 評価面談設計",
				"エンゲージメント向上施策",
				"経営者とミドルマネジメントの役割分担"
			]
		}
	}
}
		`),
	},
	{
		id: 12,
		personalityId: 1,
		name: "法律",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「法律に関するカテゴリ」に属する質問を前提に回答してください。",
		"legal_knowledge_domains": {
			"corporate_law": [
				"会社法の基本構造（株式会社・合同会社など）",
				"定款作成・変更",
				"株主総会 / 取締役会の運営",
				"株式発行・ストックオプション設計",
				"商業登記と登記実務"
			],
			"contract_law": [
				"契約書の基本構造と条項（表明保証 / 秘密保持 / 損害賠償など）",
				"契約類型（売買 / 業務委託 / 労働 / 使用貸借 / 請負）",
				"契約書レビューとリスク分析",
				"電子契約（クラウドサイン / DocuSign等）",
				"国際契約（準拠法 / 管轄合意 / 英文契約書）"
			],
			"intellectual_property": [
				"著作権法（著作物の定義・権利譲渡・ライセンス）",
				"商標法 / 意匠法（ブランド保護）",
				"特許法（発明の保護・特許出願）",
				"不正競争防止法（営業秘密・デッドコピー対策）",
				"OSSライセンス（MIT / GPL / Apacheなど）と遵守"
			],
			"labor_and_employment": [
				"労働契約法 / 労基法（労働条件・残業・解雇）",
				"就業規則と労使協定（36協定など）",
				"ハラスメント対策 / メンタルヘルス",
				"雇用形態別の対応（正社員 / 契約 / 派遣 / 業務委託）",
				"労働紛争とその解決手段（労働審判・あっせん）"
			],
			"compliance_and_risk": [
				"コンプライアンス体制構築（内部通報・教育・監査）",
				"反社チェック・マネロン防止（FATF / AML）",
				"金融商品取引法（適格投資家制度・開示）",
				"個人情報保護法（PIPA / GDPRとの比較）",
				"独禁法・下請法・景表法（取引の公正確保）"
			],
			"dispute_resolution": [
				"裁判手続（民事訴訟 / 仮処分 / 強制執行）",
				"ADR（調停・仲裁・あっせん）",
				"示談交渉 / 和解書の作成",
				"債権回収と債務整理",
				"国際紛争と国際仲裁（ICC / SIAC）"
			],
			"legal_operations_and_tech": [
				"リーガルチェックのワークフロー化",
				"法務部の業務設計（契約管理 / 訴訟管理 / 法務相談）",
				"リーガルテックツール（AIレビュー / CLM）",
				"インハウス法務と顧問弁護士の役割分担",
				"ガバナンス（取締役責任 / 監査 / J-SOX連携）"
			]
		}
	}
}
		`),
	},
	{
		id: 13,
		personalityId: 1,
		name: "投資",
		context: JSON.parse(`
{
	"input_scope": {
		"domain_of_questions": "以下の「投資に関するカテゴリ」に属する質問を前提に回答してください。",
		"investment_knowledge_domains": {
			"asset_classes": [
				"株式（国内株 / 海外株）",
				"債券（国債 / 社債 / 米国債）",
				"不動産（REIT / 直接保有）",
				"コモディティ（金 / 原油 / 農産物）",
				"暗号資産（Bitcoin / Ethereum 他）",
				"オルタナティブ資産（PE / VC / アート投資）"
			],
			"investment_strategies": [
				"長期投資（Buy & Hold）",
				"インデックス投資（ETF / 全世界分散）",
				"配当戦略（高配当株 / 配当再投資）",
				"テクニカル分析（チャートパターン / RSI / MACD）",
				"アクティブ投資（成長株 / セクター集中）",
				"短期トレード（デイトレ / スイングトレード）"
			],
			"financial_analysis": [
				"ファンダメンタル分析（ROE / PER / EPS）",
				"キャッシュフロー分析（FCF / DCF法）",
				"バリュエーション手法（相対 / 絶対）",
				"財務諸表読解（B/S, P/L, C/F）",
				"ESG評価とインパクト投資"
			],
			"portfolio_management": [
				"ポートフォリオ最適化（モダンポートフォリオ理論）",
				"分散投資と相関管理（アセットアロケーション）",
				"リスク許容度と期待リターン",
				"定率リバランス / バリア付きリバランス",
				"ドルコスト平均法（DCA）"
			],
			"risk_management": [
				"リスク指標（VaR / シャープレシオ / ベータ）",
				"ロスカット / トレーリングストップ",
				"通貨リスク / カントリーリスク",
				"レバレッジ管理（CFD / 信用取引）",
				"ブラックスワン / 不確実性耐性設計"
			],
			"fintech_and_tools": [
				"証券口座・取引プラットフォーム（SBI / 楽天 / Interactive Brokers）",
				"自動積立・ロボアド（WealthNavi / THEO）",
				"API取引 / アルゴトレード（Python / Pine Script）",
				"データソース（Bloomberg / TradingView / Quandl）",
				"AIを活用したシグナル検出・予測モデル"
			],
			"tax_and_regulations": [
				"税制優遇口座（NISA / iDeCo）",
				"投資収益の税金（譲渡益 / 配当 / 損益通算）",
				"法人投資と税務戦略（SPC設立 / 経費化）",
				"国際投資と課税条約（外国税額控除）",
				"金融商品取引法 / インサイダー規制"
			]
		}
	}
}
`),
	},
];
export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([MigratePersonalityCategoryModel]);
	await new MigratePersonalityCategoryModel().bulkUpsert(ITEM_RECORDS);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PersonalityCategories",
		{
			id: { [Op.in]: ITEM_RECORDS.map((r) => r.id) },
		},
		{},
	);
};
