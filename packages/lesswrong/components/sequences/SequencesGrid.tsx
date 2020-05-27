import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';

// Shared with SequencesGridWrapper
export const styles = theme => ({
  grid: {
  },

  loadMore: {
    marginTop: theme.spacing.unit,
  },

  gridContent: {
    marginLeft: -15,
    marginRight: -24,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    },

    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    flexFlow: "row wrap",
    [legacyBreakpoints.maxSmall]: {
      alignItems: "center",
      justifyContent: "center",
    },

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.87)",
    }
  },
});

const SequencesGrid = ({sequences, showAuthor, classes, smallerHeight}: {
  sequences: Array<SequencesPageFragment>,
  showAuthor?: boolean,
  classes: ClassesType,
  smallerHeight?: boolean,
}) =>
  <div className={classes.grid}>
    <div className={classes.gridContent}>
      {sequences.map(sequence => {
        return (
          <Components.SequencesGridItem
            sequence={sequence}
            key={sequence._id}
            showAuthor={showAuthor}
            smallerHeight={smallerHeight}/>
        );
      })}
    </div>
  </div>

const SequencesGridComponent = registerComponent('SequencesGrid', SequencesGrid, {styles});

declare global {
  interface ComponentTypes {
    SequencesGrid: typeof SequencesGridComponent
  }
}

