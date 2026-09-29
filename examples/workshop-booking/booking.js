export function createService(now = Date.now) {
  const workshops = [];
  const reservations = [];
  let nextWorkshopId = 1;
  let nextReservationId = 1;

  function clock() {
    const value = typeof now === 'function' ? now() : now;
    const time = Number(value);
    if (!Number.isFinite(time)) {
      throw new Error('시계가 올바른 밀리초를 반환하지 않습니다.');
    }
    return time;
  }

  function addWorkshop(input) {
    const source = input ?? {};
    const language = text(source.language, 40);
    const title = text(source.title, 80);
    const startsAt = Number(source.startsAt);
    const seats = Number(source.seats);
    if (!language || !title || !Number.isInteger(startsAt) || !Number.isInteger(seats) || seats < 1 || seats > 500) {
      return { ok: false, code: 'invalid', error: '언어, 제목, 시작 시각(밀리초), 좌석 수가 올바라야 합니다.' };
    }
    const workshop = {
      id: nextWorkshopId,
      language,
      title,
      startsAt,
      seats,
    };
    nextWorkshopId += 1;
    workshops.push(workshop);
    return { ok: true, workshop: { ...workshop } };
  }

  function listWorkshops() {
    const time = clock();
    return workshops.map((workshop) => ({
      ...workshop,
      reserved: reservations.filter((row) => row.workshopId === workshop.id).length,
      open: workshop.startsAt >= time,
    }));
  }

  function listReservations(workshopId) {
    return reservations
      .filter((row) => workshopId === undefined || row.workshopId === workshopId)
      .map((row) => ({ ...row }));
  }

  function reserve(workshopId, name) {
    const id = Number(workshopId);
    const workshop = workshops.find((row) => row.id === id);
    if (!workshop) {
      return { ok: false, code: 'not_found', error: '없는 워크숍입니다.' };
    }
    const time = clock();
    if (workshop.startsAt < time) {
      return { ok: false, code: 'past', error: '시작 시각이 지난 워크숍은 예약할 수 없습니다.' };
    }
    const attendee = text(name, 40);
    if (!attendee) {
      return { ok: false, code: 'invalid', error: '예약자 이름이 필요합니다.' };
    }
    const duplicate = reservations.some((row) => row.workshopId === workshop.id && row.name === attendee);
    if (duplicate) {
      return { ok: false, code: 'duplicate', error: '같은 이름은 이 워크숍에 한 번만 예약할 수 있습니다.' };
    }
    const taken = reservations.filter((row) => row.workshopId === workshop.id).length;
    if (taken >= workshop.seats) {
      return { ok: false, code: 'full', error: '좌석이 모두 찼습니다.' };
    }
    const reservation = {
      id: nextReservationId,
      workshopId: workshop.id,
      name: attendee,
      reservedAt: time,
    };
    nextReservationId += 1;
    reservations.push(reservation);
    return { ok: true, reservation: { ...reservation } };
  }

  return { addWorkshop, listWorkshops, listReservations, reserve };
}

function text(value, max) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed || [...trimmed].length > max) {
    return '';
  }
  return trimmed;
}
