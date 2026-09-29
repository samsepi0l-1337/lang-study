export const initialState = {
  languages: [
    { id: 1, name: "Python", year: 1991, paradigm: "다중 패러다임" },
    { id: 2, name: "JavaScript", year: 1995, paradigm: "다중 패러다임" },
    { id: 3, name: "Go", year: 2009, paradigm: "명령형" },
    { id: 4, name: "Rust", year: 2010, paradigm: "다중 패러다임" },
    { id: 5, name: "TypeScript", year: 2012, paradigm: "다중 패러다임" },
    { id: 6, name: "Kotlin", year: 2011, paradigm: "객체지향" },
    { id: 7, name: "Elixir", year: 2011, paradigm: "함수형" },
    { id: 8, name: "Zig", year: 2016, paradigm: "명령형" },
    { id: 9, name: "Dart", year: 2011, paradigm: "객체지향" },
    { id: 10, name: "Haskell", year: 1990, paradigm: "함수형" },
  ],
  selectedId: null,
  favorites: [],
};

export function languagesReducer(state = initialState, action) {
  switch (action.type) {
    case "language/added":
      return {
        ...state,
        languages: [...state.languages, action.payload],
      };
    case "language/selected":
      return { ...state, selectedId: action.payload };
    case "favorite/toggled": {
      const id = action.payload;
      const exists = state.favorites.includes(id);
      const favorites = exists
        ? state.favorites.filter((item) => item !== id)
        : [...state.favorites, id];
      return { ...state, favorites };
    }
    default:
      return state;
  }
}

export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);
    for (const listener of listeners.slice()) listener();
    return action;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    };
  }

  dispatch({ type: "@@INIT" });
  return { getState, dispatch, subscribe };
}
