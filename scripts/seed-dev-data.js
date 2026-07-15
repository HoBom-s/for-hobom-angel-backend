/* eslint-disable */
// Dev seed data — a browseable set of shelters/users/animals/etc. for local
// (or Atlas) testing with Postman. Idempotent: every doc has a fixed _id and is
// upserted, so re-running refreshes the seed without touching your other data.
//
//   HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB="mongodb://127.0.0.1:27017/hobom-angel" \
//     npm run seed:dev
//
// All seeded members share the password below, and email+password login works
// (POST /auth/login), so you get real tokens without hand-minting.
const { MongoClient, ObjectId } = require("mongodb");
const { hashSync } = require("bcryptjs");

const PASSWORD = "hobom1234!";
const oid = (n) => new ObjectId("6a0000000000000000000" + n);
const now = new Date();

// ── ids ──────────────────────────────────────────────────────────
const U = {
  admin: oid("001"),
  happyAdmin: oid("002"),
  happyStaff: oid("003"),
  hopeAdmin: oid("004"),
  member1: oid("005"),
  member2: oid("006"),
  member3: oid("007"),
};
const S = { happy: oid("101"), hope: oid("102") };
const A = {
  choco: oid("201"),
  nabi: oid("202"),
  mungchi: oid("203"),
  coco: oid("204"),
  baduk: oid("205"),
  yaong: oid("206"),
  dubu: oid("207"),
  gamja: oid("208"),
  bori: oid("209"),
  gureum: oid("210"),
  hodu: oid("211"),
  samsaek: oid("212"),
  kong: oid("213"),
  naong: oid("214"),
  bboppi: oid("215"),
  cheese: oid("216"),
  heukmi: oid("217"),
  hayang: oid("218"),
  danchu: oid("219"),
  meokbo: oid("220"),
};

const passwordHash = hashSync(PASSWORD, 12);

const user = (id, nickname, email, roles, shelterRoles) => ({
  _id: id,
  nickname,
  email,
  passwordHash,
  realNameEnc: "enc",
  phoneEnc: "enc",
  verifiedChannel: "EMAIL",
  roles,
  shelterRoles: shelterRoles ?? [],
  status: "ACTIVE",
  version: 0,
  createdAt: now,
  updatedAt: now,
});

const users = [
  user(U.admin, "운영자", "admin@hobom.dev", ["USER", "SYSTEM_ADMIN"]),
  user(U.happyAdmin, "행복소장", "happy-admin@hobom.dev", ["USER"], [
    { shelterId: S.happy, role: "SHELTER_ADMIN" },
  ]),
  user(U.happyStaff, "행복직원", "happy-staff@hobom.dev", ["USER"], [
    { shelterId: S.happy, role: "SHELTER_STAFF" },
  ]),
  user(U.hopeAdmin, "희망소장", "hope-admin@hobom.dev", ["USER"], [
    { shelterId: S.hope, role: "SHELTER_ADMIN" },
  ]),
  user(U.member1, "초코사랑", "member1@hobom.dev", ["USER"]),
  user(U.member2, "냥집사", "member2@hobom.dev", ["USER"]),
  user(U.member3, "봉사왕", "member3@hobom.dev", ["USER"]),
];

const shelter = (id, name, slug, address, rep, registrationNumber, businessNumber) => ({
  _id: id,
  name,
  slug,
  address,
  representatives: [rep],
  registrationNumber,
  businessNumber,
  facilityPhotos: [
    {
      objectKey: `https://placedog.net/640/480?id=${slug.length + 30}`,
      kind: "EXTERIOR",
      caption: "정문",
    },
  ],
  status: "VERIFIED",
  trustTier: "A",
  verifiedAt: now,
  version: 0,
  createdAt: now,
  updatedAt: now,
});

const shelters = [
  shelter(S.happy, "행복한 보호소", "haengbok-shelter", {
    region: "서울", city: "강남구", roadAddress: "테헤란로 123",
    lat: 37.5013, lng: 127.0396, visibility: "FULL",
  }, U.happyAdmin, "제2024-1001호", "1112233445"),
  shelter(S.hope, "희망 쉼터", "huimang-shelter", {
    region: "부산", city: "해운대구", roadAddress: "해운대로 456",
    lat: 35.1631, lng: 129.1637, visibility: "FULL",
  }, U.hopeAdmin, "제2024-1002호", "2223344556"),
];

// Verified real cat photo ids from cataas.com — deterministic `/cat/:id` URLs.
const CAT_IMG_IDS = [
  "04eEQhDfAL8l5nt3", "05Xd4JtN14983pns", "09wFxpacQzvf9jfM", "0B2g7aTANObiqPJJ",
  "0BTTVEVWXNyOgXYd", "0C2bQ39x8kuhx31p", "0DVs2d6bIVIt3ehk", "0EsIYDG0at0TPpPD",
  "0F0IKAPOdWiE755P", "0GC9MRUAqxhBzPyA", "0M0Lo3dsYft79xNd", "0mstmOIucwiN80jb",
  "0mxliw1UgtFdDkU8", "0nnJxjVoMK6GVmRS",
];
// Reliable, cute, species-correct photos. `objectKey` normally holds an
// object-storage key (the image server is deferred), but a full public URL works
// for browsing — a frontend that renders objectKey as-is shows the image. Dogs
// come from placedog.net (distinct id per dog), cats from cataas.com (distinct
// verified id per cat); both sources were verified to return real images. A
// per-species counter guarantees every animal gets a different photo.
let dogSeq = 0;
let catSeq = 0;
const nextPhoto = (species) =>
  species === "CAT"
    ? `https://cataas.com/cat/${CAT_IMG_IDS[catSeq++ % CAT_IMG_IDS.length]}?width=640&height=640`
    : `https://placedog.net/640/480?id=${(dogSeq++ * 9 + 5) % 200}`;

const animal = (id, shelterId, name, species, status, traits, story) => ({
  _id: id,
  shelterId,
  name,
  species,
  description: story,
  traits,
  health: { neutered: true, vaccinated: true, microchipId: null, notes: "건강 양호" },
  intake: { intakeDate: new Date("2026-05-01T00:00:00Z"), rescueStory: story, noticeNumber: null },
  photos: [{ objectKey: nextPhoto(species), caption: name }],
  status,
  version: 0,
  createdAt: now,
  updatedAt: now,
});
// traits carries weightKg (kg, fractional, nullable) alongside the descriptors.
const traits = (sex, size, ageMonths, weightKg, breed, color, personality) => ({
  sex, size, ageMonths, weightKg, breed, color, personality,
});

// Only dogs and cats, every one with a verified cute photo.
const animals = [
  // ── 행복한 보호소 ──
  animal(A.choco, S.happy, "초코", "DOG", "AVAILABLE", traits("MALE", "MEDIUM", 18, 12.5, "믹스", "갈색", "활발하고 사람을 좋아해요"), "길에서 구조된 순한 아이"),
  animal(A.nabi, S.happy, "나비", "CAT", "AVAILABLE", traits("FEMALE", "SMALL", 24, 4.0, "코리안숏헤어", "삼색", "얌전하고 애교가 많아요"), "묘연을 기다리는 고양이"),
  animal(A.mungchi, S.happy, "뭉치", "DOG", "RESERVED", traits("MALE", "LARGE", 36, 26.0, "진돗개 믹스", "흰색", "충성심이 강해요"), "입양 심사가 진행 중"),
  animal(A.coco, S.happy, "코코", "CAT", "ADOPTED", traits("FEMALE", "SMALL", 12, 3.8, "러시안블루", "회색", "조용하고 독립적이에요"), "행복한 가정을 찾았어요"),
  animal(A.bori, S.happy, "보리", "DOG", "AVAILABLE", traits("FEMALE", "SMALL", 10, 4.5, "포메라니안", "갈색", "복슬복슬 애교쟁이"), "작고 사랑스러운 강아지"),
  animal(A.gureum, S.happy, "구름", "CAT", "AVAILABLE", traits("FEMALE", "SMALL", 14, 4.1, "코리안숏헤어", "흰색", "포근하고 조용해요"), "무릎냥이가 될 아이"),
  animal(A.hodu, S.happy, "호두", "DOG", "AVAILABLE", traits("MALE", "MEDIUM", 20, 11.0, "비글", "삼색", "냄새 맡기를 좋아해요"), "호기심 많은 활발한 강아지"),
  animal(A.samsaek, S.happy, "삼색이", "CAT", "RESERVED", traits("FEMALE", "SMALL", 30, 4.3, "코리안숏헤어", "삼색", "새침하지만 다정해요"), "입양 심사가 진행 중"),
  animal(A.kong, S.happy, "콩이", "DOG", "AVAILABLE", traits("MALE", "SMALL", 7, 2.8, "치와와", "검정", "작지만 씩씩해요"), "겁 없는 막내"),
  animal(A.naong, S.happy, "나옹", "CAT", "AVAILABLE", traits("MALE", "SMALL", 16, 3.9, "코리안숏헤어", "턱시도", "사람을 잘 따라요"), "붙임성 좋은 고양이"),
  // ── 희망 쉼터 ──
  animal(A.baduk, S.hope, "바둑이", "DOG", "AVAILABLE", traits("MALE", "MEDIUM", 30, 14.0, "믹스", "검정흰색", "산책을 좋아해요"), "밝고 건강한 강아지"),
  animal(A.yaong, S.hope, "야옹", "CAT", "AVAILABLE", traits("MALE", "SMALL", 8, 3.2, "코리안숏헤어", "치즈", "장난기가 많아요"), "사교성 좋은 아깽이"),
  animal(A.dubu, S.hope, "두부", "DOG", "AVAILABLE", traits("FEMALE", "SMALL", 60, 3.5, "말티즈", "흰색", "차분한 노령견이에요"), "따뜻한 여생을 함께할 가족을 찾아요"),
  animal(A.gamja, S.hope, "감자", "CAT", "FOSTERED", traits("MALE", "SMALL", 6, 2.4, "코리안숏헤어", "고등어", "온순하고 잘 먹어요"), "임시보호 중인 아깽이"),
  animal(A.bboppi, S.hope, "뽀삐", "DOG", "AVAILABLE", traits("FEMALE", "MEDIUM", 22, 13.0, "코커스패니얼", "갈색", "온순하고 밝아요"), "누구와도 잘 지내는 강아지"),
  animal(A.cheese, S.hope, "치즈", "CAT", "AVAILABLE", traits("MALE", "SMALL", 11, 3.6, "코리안숏헤어", "치즈", "간식을 좋아해요"), "먹성 좋은 노랑둥이"),
  animal(A.heukmi, S.hope, "흑미", "DOG", "AVAILABLE", traits("MALE", "LARGE", 40, 24.0, "리트리버 믹스", "검정", "듬직하고 순해요"), "든든한 대형견"),
  animal(A.hayang, S.hope, "하양", "CAT", "AVAILABLE", traits("FEMALE", "SMALL", 9, 3.1, "코리안숏헤어", "흰색", "겁이 조금 많아요"), "천천히 마음을 여는 아이"),
  animal(A.danchu, S.hope, "단추", "DOG", "RESERVED", traits("FEMALE", "SMALL", 15, 3.4, "푸들", "갈색", "곱슬곱슬 귀요미"), "입양 심사가 진행 중"),
  animal(A.meokbo, S.hope, "먹보", "CAT", "FOSTERED", traits("MALE", "SMALL", 20, 4.6, "코리안숏헤어", "고등어", "잘 먹고 잘 자요"), "임시보호 중인 고양이"),
];

const questionnaire = (id, shelterId, purpose, questions) => ({
  _id: id, shelterId, purpose, questions, version: 1, createdAt: now, updatedAt: now,
});
const adoptionQuestions = [
  { id: "q1", prompt: "반려동물을 키워본 경험이 있나요?", type: "BOOLEAN", options: [], required: true },
  { id: "q2", prompt: "주거 형태를 알려주세요.", type: "SINGLE_CHOICE", options: ["아파트", "주택", "원룸"], required: true },
  { id: "q3", prompt: "입양을 결심한 이유를 적어주세요.", type: "TEXT", options: [], required: true },
];
const fosterQuestions = [
  { id: "f1", prompt: "임시보호 가능 기간은?", type: "SINGLE_CHOICE", options: ["1개월", "3개월", "무기한"], required: true },
  { id: "f2", prompt: "돌봄 가능한 시간을 적어주세요.", type: "TEXT", options: [], required: false },
];
const questionnaires = [
  questionnaire(oid("301"), S.happy, "ADOPTION", adoptionQuestions),
  questionnaire(oid("302"), S.happy, "FOSTER", fosterQuestions),
  questionnaire(oid("303"), S.hope, "ADOPTION", adoptionQuestions),
];

const ann = (id, shelterId, authorId, title, body, pinned) => ({
  _id: id, shelterId, authorId, title, body, pinned, version: 0, createdAt: now, updatedAt: now,
});
const announcements = [
  ann(oid("401"), S.happy, U.happyAdmin, "설 연휴 방문 안내", "연휴 기간 예약 방문만 가능합니다.", true),
  ann(oid("402"), S.happy, U.happyStaff, "미용 봉사자 모집", "반려동물 미용 봉사자를 찾습니다.", false),
  ann(oid("403"), S.hope, U.hopeAdmin, "후원 물품 안내", "사료와 담요를 상시 받고 있어요.", true),
  ann(oid("404"), S.hope, U.hopeAdmin, "정기 산책 봉사", "매주 토요일 오전 산책 봉사가 있어요.", false),
];

const faq = (id, shelterId, authorId, question, answer, order) => ({
  _id: id, shelterId, authorId, question, answer, order, version: 0, createdAt: now, updatedAt: now,
});
const faqs = [
  faq(oid("501"), S.happy, U.happyAdmin, "입양 절차가 어떻게 되나요?", "신청서 작성 → 상담 → 심사 → 입양 순서로 진행됩니다.", 0),
  faq(oid("502"), S.happy, U.happyAdmin, "입양 비용이 있나요?", "예방접종/중성화 실비만 받습니다.", 1),
  faq(oid("503"), S.happy, U.happyStaff, "방문 시간은 언제인가요?", "평일 10시~17시입니다.", 2),
  faq(oid("504"), S.hope, U.hopeAdmin, "임시보호도 가능한가요?", "네, 임시보호 신청도 받고 있습니다.", 0),
  faq(oid("505"), S.hope, U.hopeAdmin, "타지역도 입양 가능한가요?", "책임비와 안전한 이동이 확보되면 가능합니다.", 1),
];

const vevent = (id, shelterId, title, startAt, endAt, capacity, signedUpCount) => ({
  _id: id, shelterId, title, description: "봉사자분들을 기다립니다.",
  startAt, endAt, capacity, signedUpCount, status: "OPEN", version: 0, createdAt: now, updatedAt: now,
});
const volunteerEvents = [
  vevent(oid("601"), S.happy, "주말 산책 봉사", new Date("2026-08-01T01:00:00Z"), new Date("2026-08-01T04:00:00Z"), 10, 3),
  vevent(oid("602"), S.happy, "보호소 청소 봉사", new Date("2026-08-08T01:00:00Z"), new Date("2026-08-08T03:00:00Z"), 8, 0),
  vevent(oid("603"), S.hope, "목욕 봉사", new Date("2026-08-05T02:00:00Z"), new Date("2026-08-05T05:00:00Z"), 6, 2),
  vevent(oid("604"), S.hope, "사진 촬영 봉사", new Date("2026-08-12T00:00:00Z"), new Date("2026-08-12T02:00:00Z"), 4, 1),
];

// A completed adoption (코코 → member1) so review/reputation has real data.
const adoptionApp = {
  _id: oid("701"), animalId: A.coco, shelterId: S.happy, applicantId: U.member1,
  questionnaireVersion: 1,
  answers: [
    { questionId: "q1", values: ["true"] },
    { questionId: "q2", values: ["아파트"] },
    { questionId: "q3", values: ["평생 가족이 되어주고 싶어요."] },
  ],
  status: "APPROVED", version: 0, createdAt: now, updatedAt: now,
};

const review = (id, authorId, rating, body) => ({
  _id: id, shelterId: S.happy, authorId, placementType: "ADOPTION",
  placementRef: adoptionApp._id, rating, body, version: 0, createdAt: now, updatedAt: now,
});
const reviews = [review(oid("801"), U.member1, 5, "상담이 친절하고 아이 상태도 투명하게 알려주셨어요.")];

// ── run ──────────────────────────────────────────────────────────
// `uniqueKeys` are business keys with a unique index (e.g. email, slug). Any
// pre-existing doc holding one of our seed values under a DIFFERENT _id (say,
// left over from earlier manual testing) is removed first, so the seed stays
// authoritative and re-runnable.
async function upsertAll(db, name, docs, uniqueKeys = []) {
  const col = db.collection(name);
  for (const doc of docs) {
    for (const key of uniqueKeys) {
      if (doc[key] !== undefined) {
        await col.deleteMany({ [key]: doc[key], _id: { $ne: doc._id } });
      }
    }
    await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
  return docs.length;
}

async function main() {
  const uri = process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB;
  if (!uri) {
    console.error("HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const sets = [
    ["users", users, ["email", "nickname"]],
    ["shelters", shelters, ["slug"]],
    ["animals", animals],
    ["questionnaires", questionnaires],
    ["shelter_announcements", announcements],
    ["shelter_faqs", faqs],
    ["volunteer_events", volunteerEvents],
    ["adoption_applications", [adoptionApp]],
    ["reviews", reviews],
  ];
  for (const [name, docs, uniqueKeys] of sets) {
    const n = await upsertAll(db, name, docs, uniqueKeys);
    console.log(`  ${name.padEnd(22)} ${n}`);
  }

  await client.close();
  console.log("\n✅ seed complete");
  console.log(`\n로그인: POST /auth/login  { "email": "...", "password": "${PASSWORD}" }`);
  console.log("  운영자      admin@hobom.dev");
  console.log("  행복소장    happy-admin@hobom.dev   (shelterId " + S.happy.toHexString() + ")");
  console.log("  희망소장    hope-admin@hobom.dev    (shelterId " + S.hope.toHexString() + ")");
  console.log("  일반회원    member1@hobom.dev / member2@hobom.dev / member3@hobom.dev");
  console.log("\n예시 id — 입양가능 동물 초코: " + A.choco.toHexString());
  console.log("          보호소 슬러그: haengbok-shelter / huimang-shelter");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
